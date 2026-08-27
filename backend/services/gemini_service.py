import asyncio
import hashlib
import json
import logging
from urllib import error, request

import google.generativeai as genai

from config import settings
from database import get_database

if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
    except Exception:
        logging.getLogger(__name__).warning(
            "Gemini configuration failed; AI features will fallback gracefully.",
            exc_info=True,
        )

GEMINI_MODEL = settings.GEMINI_MODEL
logger = logging.getLogger(__name__)
_explanation_locks: dict[str, asyncio.Lock] = {}
_quiz_locks: dict[str, asyncio.Lock] = {}


def _is_quota_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(
        token in message
        for token in ["quota", "rate limit", "429", "resource exhausted", "daily limit"]
    )


def _extract_openrouter_text(payload: dict) -> str:
    choices = payload.get("choices") or []
    if not choices:
        raise ValueError("OpenRouter returned no choices")
    first_choice = choices[0]
    message = first_choice.get("message") or {}
    content = message.get("content")
    if isinstance(content, list):
        return "\n".join(
            part.get("text", "") for part in content if isinstance(part, dict)
        )
    if isinstance(content, str):
        return content
    raise ValueError("OpenRouter response lacked usable content")


async def _call_openrouter(
    prompt: str,
    *,
    model_name: str,
    generation_config: dict | None = None,
) -> str:
    if not settings.OPENROUTER_API_KEY:
        raise RuntimeError(
            "OpenRouter API key is missing. Configure OPENROUTER_API_KEY."
        )

    payload = {
        "model": settings.OPENROUTER_MODEL or model_name,
        "messages": [{"role": "user", "content": prompt}],
    }
    if generation_config:
        payload["temperature"] = generation_config.get("temperature", 0.7)

    url = f"{settings.OPENROUTER_BASE_URL.rstrip('/')}/chat/completions"
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.BACKEND_URL or "https://example.com",
            "X-Title": "EduPilot",
        },
        method="POST",
    )

    def send_request() -> str:
        with request.urlopen(req, timeout=60) as response:
            body = response.read().decode("utf-8")
            return _extract_openrouter_text(json.loads(body))

    try:
        return await asyncio.to_thread(send_request)
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        payload_detail = detail.strip() or str(exc)
        if exc.code == 429:
            raise RuntimeError(f"AI provider quota exceeded: {payload_detail}") from exc
        raise RuntimeError(
            f"OpenRouter request failed ({exc.code}): {payload_detail}"
        ) from exc


async def _generate_with_fallback(
    prompt: str,
    *,
    model_name: str,
    generation_config: dict | None = None,
    task: str = "AI generation",
):
    if not settings.GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. Configure it in the backend environment."
        )

    try:
        model = genai.GenerativeModel(
            model_name, generation_config=generation_config or {}
        )
        response = await asyncio.to_thread(model.generate_content, prompt)
        return response.text
    except Exception as exc:
        logger.warning("%s failed via Gemini: %s", task, exc)
        if _is_quota_error(exc):
            if settings.OPENROUTER_API_KEY:
                logger.info("Falling back to OpenRouter for %s", task)
                return await _call_openrouter(
                    prompt, model_name=model_name, generation_config=generation_config
                )
            raise RuntimeError(
                "AI provider quota exceeded. Please try again later."
            ) from exc
        raise


def _clean_json(response_text: str) -> str:
    response_text = response_text.strip()
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]
    return response_text.strip()


def _extract_first_json_array(response_text: str) -> str:
    decoder = json.JSONDecoder()
    for start, character in enumerate(response_text):
        if character != "[":
            continue
        try:
            _, end = decoder.raw_decode(response_text[start:])
            return response_text[start : start + end]
        except json.JSONDecodeError:
            continue
    raise ValueError("Expected a JSON array")


def _parse_quiz_questions(response_text: str) -> list[dict]:
    """Parse and validate provider output before it reaches the API."""
    logger.info("Quiz raw AI response: %s", response_text)
    cleaned = _clean_json(response_text)
    logger.info("Quiz cleaned AI response: %s", cleaned)
    try:
        data = json.loads(_extract_first_json_array(cleaned))
    except (json.JSONDecodeError, ValueError) as exc:
        logger.exception("Quiz JSON parsing failed: %s", exc)
        raise ValueError("Expected a valid JSON array") from exc

    if isinstance(data, dict):
        for key in ("questions", "quiz", "items"):
            if isinstance(data.get(key), list):
                data = data[key]
                break
    if not isinstance(data, list) or not data:
        raise ValueError("Expected a non-empty JSON array")

    normalized = []
    for question in data:
        if not isinstance(question, dict):
            raise ValueError("Each quiz question must be an object")
        options = question.get("options")
        answer = question.get("correct_answer", question.get("answer"))
        if isinstance(answer, str) and len(answer) == 1:
            answer = ord(answer.upper()) - ord("A")
        if (
            not isinstance(question.get("question"), str)
            or not isinstance(options, list)
            or len(options) != 4
            or not all(isinstance(option, str) for option in options)
            or not isinstance(answer, int)
            or not 0 <= answer < len(options)
        ):
            raise ValueError("Invalid quiz question format")
        normalized.append(
            {
                "question": question["question"],
                "options": options,
                "correct_answer": answer,
                "explanation": str(question.get("explanation", "")),
            }
        )
    logger.info("Quiz parsed JSON: %s", normalized)
    return normalized


async def _repair_quiz_response(response_text: str) -> list[dict]:
    repair_prompt = f"""
Convert the following attempted quiz response into valid JSON.
Return only a JSON array of question objects. Do not use markdown or code fences.
Each object must contain question (string), options (exactly 4 strings),
correct_answer (one of A, B, C, or D), and no other fields are required.

Attempted response:
{response_text}
"""
    repaired = await _generate_with_fallback(
        repair_prompt,
        model_name=GEMINI_MODEL,
        generation_config={"temperature": 0},
        task="quiz response repair",
    )
    return _parse_quiz_questions(repaired)


async def generate_roadmap(
    name: str, goal: str, daily_study_time: int, skill_level: str, learning_style: str
) -> dict:
    prompt = f"""
    Generate a structured weekly learning roadmap for a student named {name}.
    Goal: {goal}
    Daily study time: {daily_study_time} minutes
    Skill level: {skill_level}
    Learning style: {learning_style}

    Return a JSON object with the following structure:
    {{
        "total_weeks": int,
        "weeks": [
            {{
                "week_number": int,
                "title": string,
                "topics": [
                    {{
                        "title": string,
                        "description": string,
                        "estimated_minutes": int,
                        "order": int
                    }}
                ]
            }}
        ],
        "milestones": [
            {{
                "title": string,
                "week_number": int,
                "description": string
            }}
        ]
    }}
    """
    try:
        response_text = await _generate_with_fallback(
            prompt,
            model_name=GEMINI_MODEL,
            generation_config={
                "temperature": 0.7,
            },
            task="roadmap generation",
        )
        return json.loads(_clean_json(response_text))
    except RuntimeError as exc:
        raise ValueError(str(exc)) from exc
    except Exception as e:
        raise ValueError(f"Failed to generate roadmap: {str(e)}")


async def explain_topic(topic_title: str, context: str, skill_level: str) -> str:
    cache_key = hashlib.sha256(
        f"{GEMINI_MODEL}\0{topic_title}\0{context}\0{skill_level}".encode()
    ).hexdigest()
    lock = _explanation_locks.setdefault(cache_key, asyncio.Lock())

    async with lock:
        db = get_database()
        cached = await db.ai_cache.find_one({"key": cache_key}, {"_id": 0, "value": 1})
        if isinstance(cached, dict) and isinstance(cached.get("value"), str):
            return cached["value"]

        prompt = f"""
        Explain the topic: "{topic_title}".
        Target skill level: {skill_level}.
        Context/Additional info: {context}

        Please provide:
        1. A simple explanation.
        2. A real-world example.
        3. A step-by-step breakdown.
        4. If it is a coding topic, include sample code.
        Format the output nicely in Markdown.
        """
        response_text = await _generate_with_fallback(
            prompt,
            model_name=GEMINI_MODEL,
            generation_config={"temperature": 0.7},
            task="topic explanation",
        )
        explanation = response_text
        if not explanation:
            raise ValueError("Gemini returned an empty explanation")

        await db.ai_cache.update_one(
            {"key": cache_key},
            {
                "$set": {
                    "value": explanation,
                    "kind": "topic_explanation",
                    "model": GEMINI_MODEL,
                }
            },
            upsert=True,
        )
        return explanation


async def generate_quiz(topic_title: str, skill_level: str) -> list[dict]:
    cache_key = hashlib.sha256(
        f"quiz\0{GEMINI_MODEL}\0{topic_title}\0{skill_level}".encode()
    ).hexdigest()
    lock = _quiz_locks.setdefault(cache_key, asyncio.Lock())

    prompt = f"""
    Generate exactly 5 multiple choice questions for the topic: "{topic_title}".
    Target skill level: {skill_level}.

    Return a JSON array of objects, where each object has:
    - "question": string
    - "options": array of exactly 4 strings
    - "correct_answer": one of "A", "B", "C", or "D"

    Return ONLY valid JSON. No markdown, no explanation, and no ```json blocks.
    """
    async with lock:
        try:
            db = get_database()
            cached = await db.ai_cache.find_one(
                {"key": cache_key}, {"_id": 0, "value": 1}
            )
            if isinstance(cached, dict) and isinstance(cached.get("value"), list):
                return _parse_quiz_questions(json.dumps(cached["value"]))
        except RuntimeError:
            db = None

        try:
            response_text = await _generate_with_fallback(
                prompt,
                model_name=GEMINI_MODEL,
                generation_config={
                    "temperature": 0.7,
                },
                task="quiz generation",
            )
            try:
                questions = _parse_quiz_questions(response_text)
            except (TypeError, ValueError, json.JSONDecodeError):
                logger.warning("Quiz provider returned invalid JSON; attempting repair")
                questions = await _repair_quiz_response(response_text)
            if db is not None:
                await db.ai_cache.update_one(
                    {"key": cache_key},
                    {
                        "$set": {
                            "value": questions,
                            "kind": "quiz_questions",
                            "model": GEMINI_MODEL,
                        }
                    },
                    upsert=True,
                )
            return questions
        except RuntimeError:
            raise
        except Exception as e:
            logger.exception("Quiz generation failed after repair attempt")
            raise ValueError(f"Failed to generate quiz: {str(e)}") from e


async def generate_recommendation(topic_title: str, score: int, total: int) -> dict:
    percentage = (score / total) * 100 if total > 0 else 0
    prompt = f"""
    A student just took a quiz on "{topic_title}" and scored {score}/{total} ({percentage}%).
    If the score is below 60%, recommend revision. If the score is 60% or higher, recommend moving to the next topic or practicing.

    Return a JSON object with:
    - "type": string (either "revision", "next_topic", or "practice")
    - "topic_title": string (the topic they should focus on)
    - "estimated_minutes": integer
    - "difficulty": string (beginner, intermediate, or advanced)
    - "reason": string (a short encouraging reason for this recommendation)
    """
    try:
        response_text = await _generate_with_fallback(
            prompt,
            model_name=GEMINI_MODEL,
            generation_config={
                "temperature": 0.7,
            },
            task="recommendation generation",
        )
        return json.loads(_clean_json(response_text))
    except Exception as e:
        raise ValueError(f"Failed to generate recommendation: {str(e)}")


async def chat_response(message: str, history: list[dict], context: str = "") -> str:
    history_text = "\n".join([f"{m['role']}: {m['content']}" for m in history[-10:]])
    prompt = f"""You are EduPilot, an expert educational mentor. Explain concepts at the student's skill level.
Always respond in Markdown using exactly these sections, with more than one paragraph:
## 1. Explanation
## 2. Real-world Example
## 3. Key Points
## 4. Common Mistakes
## 5. Quick Revision
## 6. Practice Question
Include an analogy in the Real-world Example section and a concise summary in Quick Revision.

Conversation history:
{history_text}

Student's message: {message}

Provide a helpful, encouraging response. Use markdown formatting. If the student asks about a topic, explain it clearly with examples."""
    return await _generate_with_fallback(
        prompt,
        model_name=GEMINI_MODEL,
        generation_config={"temperature": 0.7},
        task="chat response",
    )


async def generate_notes(topic: str, skill_level: str) -> str:
    prompt = f"""You are EduPilot, an expert teacher creating study notes for a {skill_level} student.
Create structured Markdown notes for: "{topic}".
Use exactly these sections:
## Short Notes
## Detailed Notes
## Exam Notes
## One Minute Revision
## Important Interview Questions

Use headings, bullet points, examples, important formulas when applicable, exam tips, and clear revision summaries. Keep the content accurate and practical. Do not answer in one paragraph."""
    return await _generate_with_fallback(
        prompt,
        model_name=GEMINI_MODEL,
        generation_config={"temperature": 0.6},
        task="note generation",
    )
