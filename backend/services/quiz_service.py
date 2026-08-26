from datetime import datetime, timezone
from bson import ObjectId
from database import get_database
from services.gemini_service import generate_recommendation


async def create_quiz(student_id: str, topic_title: str, questions: list[dict]) -> dict:
    db = get_database()
    quiz = {
        "student_id": student_id,
        "topic_title": topic_title,
        "questions": questions,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.quizzes.insert_one(quiz)
    quiz["_id"] = str(result.inserted_id)
    return quiz


async def get_quiz(quiz_id: str) -> dict:
    db = get_database()
    if not ObjectId.is_valid(quiz_id):
        return None
    quiz = await db.quizzes.find_one({"_id": ObjectId(quiz_id)})
    if quiz:
        quiz["_id"] = str(quiz["_id"])
    return quiz


async def submit_quiz(student_id: str, quiz_id: str, answers: list[dict]) -> dict:
    db = get_database()
    quiz = await get_quiz(quiz_id)
    if not quiz:
        raise ValueError("Quiz not found")
    if quiz["student_id"] != student_id:
        raise ValueError("Quiz does not belong to this student")

    score = 0
    total = len(quiz["questions"])
    evaluated_answers = []

    # answers parameter is list of dict with question_index and selected_answer
    answers_map = {ans["question_index"]: ans["selected_answer"] for ans in answers}

    for i, q in enumerate(quiz["questions"]):
        selected = answers_map.get(i)
        is_correct = selected == q["correct_answer"]
        if is_correct:
            score += 1
        evaluated_answers.append(
            {"question_index": i, "selected_answer": selected, "is_correct": is_correct}
        )

    quiz_result = {
        "student_id": student_id,
        "quiz_id": quiz_id,
        "topic_title": quiz["topic_title"],
        "score": score,
        "total": total,
        "answers": evaluated_answers,
        "created_at": datetime.now(timezone.utc),
    }

    res = await db.quiz_results.insert_one(quiz_result)
    quiz_result["_id"] = str(res.inserted_id)

    await db.roadmaps.update_one(
        {"student_id": student_id},
        {"$set": {"weeks.$[w].topics.$[t].is_completed": True}},
        array_filters=[
            {"w.topics": {"$elemMatch": {"title": quiz["topic_title"]}}},
            {"t.title": quiz["topic_title"]},
        ],
    )

    recommendation_data = await generate_recommendation(
        quiz["topic_title"], score, total
    )
    recommendation_data["student_id"] = student_id
    recommendation_data["created_at"] = datetime.now(timezone.utc)
    rec_res = await db.recommendations.insert_one(recommendation_data)
    recommendation_data["_id"] = str(rec_res.inserted_id)

    return {"result": quiz_result, "recommendation": recommendation_data}
