import google.generativeai as genai
import json
import re
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)


def _clean_json(response_text: str) -> str:
    # Strip markdown code fences if present
    response_text = response_text.strip()
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]
    return response_text.strip()


async def generate_roadmap(
    name: str, goal: str, daily_study_time: int, skill_level: str, learning_style: str
) -> dict:
    model = genai.GenerativeModel(
        "gemini-3.5-flash",
        generation_config={
            "temperature": 0.7,
            "response_mime_type": "application/json",
        },
    )
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
    response = model.generate_content(prompt)
    try:
        return json.loads(_clean_json(response.text))
    except Exception as e:
        raise ValueError(f"Failed to generate roadmap: {str(e)}")


async def explain_topic(topic_title: str, context: str, skill_level: str) -> str:
    model = genai.GenerativeModel(
        "gemini-3.5-flash", generation_config={"temperature": 0.7}
    )
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
    response = model.generate_content(prompt)
    return response.text


async def generate_quiz(topic_title: str, skill_level: str) -> list[dict]:
    model = genai.GenerativeModel(
        "gemini-3.5-flash",
        generation_config={
            "temperature": 0.7,
            "response_mime_type": "application/json",
        },
    )
    prompt = f"""
    Generate exactly 5 multiple choice questions for the topic: "{topic_title}".
    Target skill level: {skill_level}.
    
    Return a JSON array of objects, where each object has:
    - "question": string
    - "options": array of exactly 4 strings
    - "correct_answer": integer (0 to 3) representing the index of the correct option
    - "explanation": string explaining why the answer is correct
    """
    response = model.generate_content(prompt)
    try:
        data = json.loads(_clean_json(response.text))
        if not isinstance(data, list):
            raise ValueError("Expected a JSON array")
        return data
    except Exception as e:
        raise ValueError(f"Failed to generate quiz: {str(e)}")


async def generate_recommendation(topic_title: str, score: int, total: int) -> dict:
    model = genai.GenerativeModel(
        "gemini-3.5-flash",
        generation_config={
            "temperature": 0.7,
            "response_mime_type": "application/json",
        },
    )
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
    response = model.generate_content(prompt)
    try:
        return json.loads(_clean_json(response.text))
    except Exception as e:
        raise ValueError(f"Failed to generate recommendation: {str(e)}")


async def chat_response(message: str, history: list[dict], context: str = "") -> str:
    model = genai.GenerativeModel(
        "gemini-3.5-flash", generation_config={"temperature": 0.7}
    )
    # Build conversation history for context
    history_text = "\n".join(
        [f"{m['role']}: {m['content']}" for m in history[-10:]]
    )  # Last 10 messages
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
    response = model.generate_content(prompt)
    return response.text


async def generate_notes(topic: str, skill_level: str) -> str:
    model = genai.GenerativeModel(
        "gemini-3.5-flash", generation_config={"temperature": 0.6}
    )
    prompt = f"""You are EduPilot, an expert teacher creating study notes for a {skill_level} student.
Create structured Markdown notes for: "{topic}".
Use exactly these sections:
## Short Notes
## Detailed Notes
## Exam Notes
## One Minute Revision
## Important Interview Questions

Use headings, bullet points, examples, important formulas when applicable, exam tips, and clear revision summaries. Keep the content accurate and practical. Do not answer in one paragraph."""
    response = model.generate_content(prompt)
    return response.text
