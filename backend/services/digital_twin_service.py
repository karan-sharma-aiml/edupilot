from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from bson import ObjectId

from config import settings
from database import get_database

try:
    import google.generativeai as genai

    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
except Exception:  # pragma: no cover
    genai = None


logger = logging.getLogger(__name__)


def _clamp(value: float, minimum: int = 0, maximum: int = 100) -> int:
    return max(minimum, min(maximum, int(round(value))))


def _clean_json(response_text: str) -> str:
    response_text = response_text.strip()
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]
    return response_text.strip()


async def generate_learning_dna_from_ai(payload: dict) -> dict:
    if not genai or not settings.GEMINI_API_KEY:
        return build_learning_dna(payload)

    model = genai.GenerativeModel(
        "gemini-3.5-flash",
        generation_config={
            "temperature": 0.6,
            "response_mime_type": "application/json",
        },
    )

    student = payload.get("student") or {}
    roadmap = payload.get("roadmap") or {}
    quiz_scores = payload.get("quiz_scores") or []
    weak_topics = payload.get("weak_topics") or []
    total_topics = sum(
        1 for week in roadmap.get("weeks", []) for topic in week.get("topics", [])
    )
    completed_topics = sum(
        1
        for week in roadmap.get("weeks", [])
        for topic in week.get("topics", [])
        if topic.get("is_completed")
    )
    avg_quiz = (
        round(
            (
                sum(
                    (q.get("score", 0) / max(q.get("total", 1), 1) for q in quiz_scores)
                )
                / len(quiz_scores)
            )
            * 100,
            2,
        )
        if quiz_scores
        else 50.0
    )

    prompt = f"""
    You are EduPilot's learning intelligence engine. Analyze this student's real activity data and provide a concise but exact learning DNA JSON object.

    Student profile:
    - name: {student.get('name', 'Student')}
    - skill level: {student.get('skill_level', 'beginner')}
    - learning style: {student.get('learning_style', 'mixed')}
    - daily study time: {student.get('daily_study_time', 0)} minutes
    - total topics: {total_topics}
    - completed topics: {completed_topics}
    - average quiz accuracy: {avg_quiz}%
    - weak topics: {weak_topics[:5]}
    - notes count: {payload.get('notes_count', 0)}
    - recommendations count: {payload.get('recommendation_count', 0)}

    Based only on this evidence, generate JSON with keys:
    learning_personality, learning_speed, retention_score, confidence_score, revision_need, most_improved_skill, current_weakness, current_strength, recommended_study_style, best_time_to_study, estimated_time_to_goal, learning_momentum, learning_health: {{"score": 0, "label": "string", "summary": "string"}}, predictions: [{{"text": "string", "priority": "string", "reason": "string"}}].

    Return only valid JSON, no markdown fences.
    """

    try:
        response = model.generate_content(prompt)
        data = json.loads(_clean_json(response.text))
        required_fields = {
            "learning_personality",
            "learning_speed",
            "retention_score",
            "confidence_score",
            "revision_need",
            "most_improved_skill",
            "current_weakness",
            "current_strength",
            "recommended_study_style",
            "best_time_to_study",
            "estimated_time_to_goal",
            "learning_momentum",
            "learning_health",
            "predictions",
        }
        if (
            isinstance(data, dict)
            and required_fields.issubset(data)
            and isinstance(data["learning_health"], dict)
            and isinstance(data["predictions"], list)
        ):
            data["updated_at"] = datetime.now(timezone.utc)
            data["metadata"] = {
                "total_topics": total_topics,
                "completed_topics": completed_topics,
                "quiz_accuracy": avg_quiz,
                "notes_count": payload.get("notes_count", 0),
                "recommendation_count": payload.get("recommendation_count", 0),
                "weak_topics": weak_topics,
            }
            return data
    except Exception:
        logger.exception("Gemini learning DNA generation failed; using fallback")

    return build_learning_dna(payload)


def build_learning_dna(payload: dict) -> dict:
    student = payload.get("student") or {}
    roadmap = payload.get("roadmap") or {}
    quiz_scores = payload.get("quiz_scores") or []
    sessions = payload.get("sessions") or []
    weak_topics = payload.get("weak_topics") or []
    notes_count = int(payload.get("notes_count") or 0)
    recommendation_count = int(payload.get("recommendation_count") or 0)

    total_topics = 0
    completed_topics = 0
    for week in roadmap.get("weeks", []):
        for topic in week.get("topics", []):
            total_topics += 1
            if topic.get("is_completed"):
                completed_topics += 1

    if quiz_scores:
        accuracy = sum(
            (q.get("score", 0) / max(q.get("total", 1), 1)) for q in quiz_scores
        )
        quiz_accuracy = accuracy / len(quiz_scores)
    else:
        quiz_accuracy = 0.5

    total_session_minutes = 0
    for session in sessions:
        started = session.get("started_at")
        completed = session.get("completed_at") or started
        if isinstance(started, str) and isinstance(completed, str):
            try:
                s = datetime.fromisoformat(started.replace("Z", "+00:00"))
                c = datetime.fromisoformat(completed.replace("Z", "+00:00"))
                total_session_minutes += max(0, int((c - s).total_seconds() / 60))
            except ValueError:
                continue

    completion_ratio = (completed_topics / total_topics) if total_topics else 0
    retention_score = _clamp(
        (quiz_accuracy * 100) * 0.7 + (completion_ratio * 100) * 0.3
    )
    confidence_score = _clamp(
        55
        + (quiz_accuracy * 100) * 0.45
        + (notes_count * 5)
        + (recommendation_count * 4)
    )

    if quiz_accuracy >= 0.8 and completion_ratio >= 0.6:
        learning_personality = (
            "Fast conceptual learner who converts ideas into action quickly."
        )
        learning_speed = "Accelerating"
    elif quiz_accuracy >= 0.6:
        learning_personality = (
            "Steady learner who improves with repetition and structured revision."
        )
        learning_speed = "Balanced"
    else:
        learning_personality = (
            "Cautious learner who needs guided practice and gradual learning loops."
        )
        learning_speed = "Deliberate"

    if weak_topics:
        current_weakness = weak_topics[0]
        revision_need = (
            f"Revise {weak_topics[0]} before the next session to protect retention."
        )
    else:
        current_weakness = "Core concept consistency"
        revision_need = "Keep short revision loops to maintain high retention."

    strongest_topic = "Consistency"
    if quiz_scores:
        strongest = max(
            quiz_scores,
            key=lambda q: (q.get("score", 0) / max(q.get("total", 1), 1)),
        )
        strongest_topic = strongest.get("topic_title") or strongest_topic
    current_strength = strongest_topic

    study_style = student.get("learning_style") or "mixed"
    recommended_study_style = {
        "visual": "Visual-first explanations with diagrams and comparison charts.",
        "reading": "Short reading blocks with structured summaries and notes.",
        "hands-on": "Practice-heavy sessions with immediate feedback and mini exercises.",
        "mixed": "A blend of concise concept explanations and active recall drills.",
    }.get(
        study_style,
        "A blend of concise explanations and active recall practice.",
    )

    best_time_to_study = "Evening" if total_session_minutes > 0 else "Early evening"
    estimated_time_to_goal = "2–4 weeks" if completion_ratio < 0.7 else "1–2 weeks"

    if confidence_score >= 80 and retention_score >= 75:
        learning_momentum = "Strong upward trend"
        learning_health_score = 88
        health_label = "Excellent"
        health_summary = "You are learning consistently and retaining core ideas with strong confidence."
    elif confidence_score >= 65 and retention_score >= 60:
        learning_momentum = "Steady improvement"
        learning_health_score = 74
        health_label = "Good"
        health_summary = "Your learning rhythm is healthy, with room to improve revision consistency."
    elif confidence_score >= 50:
        learning_momentum = "Needs sustained reinforcement"
        learning_health_score = 58
        health_label = "Average"
        health_summary = "Progress is visible, but retention and practice frequency need more attention."
    else:
        learning_momentum = "At risk of plateau"
        learning_health_score = 42
        health_label = "Needs Attention"
        health_summary = "Retention and recall are dropping; a tighter review cycle will reduce friction."

    predictions = []
    if weak_topics:
        predictions.append(
            {
                "text": f"You may forget {weak_topics[0]} within the next week unless you revise it again.",
                "priority": "high",
                "reason": "Your recent quiz performance indicates recurring difficulty with this concept.",
            }
        )
    else:
        predictions.append(
            {
                "text": "You are likely ready for your next challenge topic.",
                "priority": "medium",
                "reason": "Your recent consistency and quiz results suggest the current concepts are sticking.",
            }
        )

    if len(predictions) < 2:
        if completion_ratio >= 0.5:
            predictions.append(
                {
                    "text": "You are progressing faster than expected for this roadmap stage.",
                    "priority": "medium",
                    "reason": "You are retaining the material and completing work ahead of the expected pace.",
                }
            )
        else:
            predictions.append(
                {
                    "text": "You should revise today to prevent retention loss before the next milestone.",
                    "priority": "high",
                    "reason": "Your completion trend is healthy but still needs reinforcement to lock in understanding.",
                }
            )

    if completion_ratio >= 0.5:
        predictions.append(
            {
                "text": "You are progressing faster than expected for this roadmap stage.",
                "priority": "medium",
                "reason": "You are retaining the material and completing work ahead of the expected pace.",
            }
        )
    else:
        predictions.append(
            {
                "text": "You should revise today to prevent retention loss before the next milestone.",
                "priority": "high",
                "reason": "Your completion trend is healthy but still needs reinforcement to lock in understanding.",
            }
        )

    most_improved_skill = current_strength
    if notes_count >= 2:
        most_improved_skill = current_strength

    return {
        "student_id": payload.get("student_id") or "unknown",
        "learning_personality": learning_personality,
        "learning_speed": learning_speed,
        "retention_score": retention_score,
        "confidence_score": confidence_score,
        "revision_need": revision_need,
        "most_improved_skill": most_improved_skill,
        "current_weakness": current_weakness,
        "current_strength": current_strength,
        "recommended_study_style": recommended_study_style,
        "best_time_to_study": best_time_to_study,
        "estimated_time_to_goal": estimated_time_to_goal,
        "learning_momentum": learning_momentum,
        "learning_health": {
            "score": learning_health_score,
            "label": health_label,
            "summary": health_summary,
        },
        "predictions": predictions,
        "updated_at": datetime.now(timezone.utc),
        "metadata": {
            "total_topics": total_topics,
            "completed_topics": completed_topics,
            "quiz_accuracy": round(quiz_accuracy * 100, 1),
            "notes_count": notes_count,
            "recommendation_count": recommendation_count,
            "weak_topics": weak_topics,
            "study_minutes": total_session_minutes,
        },
    }


async def sync_learning_dna(student_id: str, user_id: str | None = None) -> dict | None:
    db = get_database()
    try:
        student = await db.students.find_one({"_id": ObjectId(student_id)})
    except Exception:
        return None

    if student is None:
        return None

    roadmap = await db.roadmaps.find_one({"student_id": student_id})
    quiz_scores = (
        await db.quiz_results.find({"student_id": student_id})
        .sort("created_at", -1)
        .to_list(length=None)
    )
    sessions = (
        await db.sessions.find({"student_id": student_id})
        .sort("started_at", -1)
        .to_list(length=None)
    )
    notes_count = await db.notes.count_documents({"student_id": student_id})
    recommendation_count = await db.recommendations.count_documents(
        {"student_id": student_id}
    )

    weak_topics = []
    for q in quiz_scores:
        total = q.get("total", 0)
        if total and (q.get("score", 0) / total) < 0.6:
            topic = q.get("topic_title")
            if topic and topic not in weak_topics:
                weak_topics.append(topic)

    payload = {
        "student_id": student_id,
        "user_id": user_id,
        "student": {
            "name": student.get("name"),
            "skill_level": student.get("skill_level"),
            "daily_study_time": student.get("daily_study_time"),
            "learning_style": student.get("learning_style"),
        },
        "roadmap": roadmap or {"weeks": []},
        "quiz_scores": quiz_scores,
        "sessions": sessions,
        "notes_count": notes_count,
        "recommendation_count": recommendation_count,
        "weak_topics": weak_topics,
    }
    result = await generate_learning_dna_from_ai(payload)

    document = {
        "student_id": student_id,
        "user_id": user_id or student.get("user_id"),
        "learning_personality": result["learning_personality"],
        "learning_speed": result["learning_speed"],
        "retention_score": result["retention_score"],
        "confidence_score": result["confidence_score"],
        "revision_need": result["revision_need"],
        "most_improved_skill": result["most_improved_skill"],
        "current_weakness": result["current_weakness"],
        "current_strength": result["current_strength"],
        "recommended_study_style": result["recommended_study_style"],
        "best_time_to_study": result["best_time_to_study"],
        "estimated_time_to_goal": result["estimated_time_to_goal"],
        "learning_momentum": result["learning_momentum"],
        "learning_health": result["learning_health"],
        "predictions": result["predictions"],
        "metadata": result["metadata"],
        "updated_at": result["updated_at"],
    }

    existing = await db.learning_dna.find_one({"student_id": student_id})
    if existing:
        await db.learning_dna.update_one({"_id": existing["_id"]}, {"$set": document})
    else:
        await db.learning_dna.insert_one(document)

    return result
