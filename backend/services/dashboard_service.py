from database import get_database
from bson import ObjectId
from datetime import datetime, timezone
from services.digital_twin_service import sync_learning_dna
from services.roadmap_service import get_roadmap, get_student


async def get_dashboard(student_id: str) -> dict:
    db = get_database()
    student = await get_student(student_id)
    if not student:
        raise ValueError("Student not found")

    roadmap = await get_roadmap(student_id)
    learning_dna = await sync_learning_dna(student_id, student.get("user_id"))

    total_topics = 0
    completed_topics_count = 0
    completed_topics = []

    if roadmap:
        for week in roadmap.get("weeks", []):
            for topic in week.get("topics", []):
                total_topics += 1
                if topic.get("is_completed"):
                    completed_topics_count += 1
                    completed_topics.append(topic.get("title"))

    progress_percentage = (
        (completed_topics_count / total_topics * 100) if total_topics > 0 else 0
    )

    quiz_cursor = db.quiz_results.find({"student_id": student_id}).sort(
        "created_at", -1
    )
    quiz_scores = []
    weak_topics = []

    async for q in quiz_cursor:
        q["_id"] = str(q["_id"])
        quiz_scores.append(q)
        score = q.get("score", 0)
        total = q.get("total", 0)
        topic_title = q.get("topic_title")
        if topic_title and total and score / total < 0.6:
            if topic_title not in weak_topics:
                weak_topics.append(topic_title)

    rec_cursor = (
        db.recommendations.find({"student_id": student_id})
        .sort("created_at", -1)
        .limit(1)
    )
    next_recommendation = None
    async for r in rec_cursor:
        r["_id"] = str(r["_id"])
        next_recommendation = r

    sessions = (
        await db.sessions.find({"student_id": student_id})
        .sort("started_at", -1)
        .to_list(None)
    )
    for session in sessions:
        if session.get("_id"):
            session["_id"] = str(session["_id"])
    learning_streak = 0
    best_streak = 0
    if sessions:
        from datetime import timedelta

        seen_dates = set()
        for s in sessions:
            started = s.get("started_at") or s.get("created_at")
            if isinstance(started, datetime):
                seen_dates.add(started.date())
            elif isinstance(started, str):
                try:
                    seen_dates.add(
                        datetime.fromisoformat(started.replace("Z", "+00:00")).date()
                    )
                except ValueError:
                    continue
        if seen_dates:
            today = datetime.now(timezone.utc).date()
            current = today
            while current in seen_dates:
                learning_streak += 1
                current -= timedelta(days=1)
            ordered_dates = sorted(seen_dates)
            run = 1
            for index in range(1, len(ordered_dates)):
                if ordered_dates[index] == ordered_dates[index - 1] + timedelta(days=1):
                    run += 1
                else:
                    best_streak = max(best_streak, run)
                    run = 1
            best_streak = max(best_streak, run)
            await db.students.update_one(
                {"_id": ObjectId(student_id)}, {"$max": {"best_streak": best_streak}}
            )

    learning_dna_document = await db.learning_dna.find_one({"student_id": student_id})
    if learning_dna_document and learning_dna_document.get("_id"):
        learning_dna_document["_id"] = str(learning_dna_document["_id"])
    return {
        "student": student,
        "roadmap_progress": {
            "completed": completed_topics_count,
            "total": total_topics,
            "percentage": progress_percentage,
        },
        "quiz_scores": quiz_scores,
        "weak_topics": weak_topics,
        "completed_topics": completed_topics,
        "learning_streak": learning_streak,
        "best_streak": max(best_streak, student.get("best_streak") or 0),
        "next_recommendation": next_recommendation,
        "learning_dna": learning_dna_document or learning_dna,
    }
