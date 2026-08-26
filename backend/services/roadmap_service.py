from datetime import datetime, timezone
from bson import ObjectId
from database import get_database


async def create_student(data: dict, user_id: str | None = None) -> str:
    db = get_database()
    now = datetime.now(timezone.utc)
    if user_id:
        existing = await db.students.find_one({"user_id": user_id})
        if not existing:
            existing_roadmap = await db.roadmaps.find_one({"user_id": user_id})
            if existing_roadmap and ObjectId.is_valid(
                existing_roadmap.get("student_id", "")
            ):
                existing = await db.students.find_one(
                    {"_id": ObjectId(existing_roadmap["student_id"])}
                )
        if existing:
            await db.students.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {**data, "user_id": user_id},
                    "$setOnInsert": {"created_at": now},
                },
            )
            return str(existing["_id"])

    data["created_at"] = now
    if user_id:
        data["user_id"] = user_id
    result = await db.students.insert_one(data)
    return str(result.inserted_id)


async def ensure_student_for_user(user: dict) -> str:
    user_id = str(user["_id"])
    db = get_database()
    student = await db.students.find_one({"user_id": user_id})
    if student:
        return str(student["_id"])

    legacy_roadmap = await db.roadmaps.find_one({"user_id": user_id})
    legacy_student_id = legacy_roadmap.get("student_id") if legacy_roadmap else None
    if legacy_student_id and ObjectId.is_valid(legacy_student_id):
        student = await db.students.find_one({"_id": ObjectId(legacy_student_id)})
        if student:
            await db.students.update_one(
                {"_id": student["_id"]}, {"$set": {"user_id": user_id}}
            )
            return str(student["_id"])

    student = {
        "user_id": user_id,
        "name": user.get("name") or "Student",
        "goal": user.get("goal") or "",
        "daily_study_time": user.get("daily_study_time") or 60,
        "skill_level": user.get("skill_level") or "beginner",
        "learning_style": user.get("learning_style") or "mixed",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.students.insert_one(student)
    return str(result.inserted_id)


async def create_roadmap(
    student_id: str, roadmap_data: dict, user_id: str | None = None
) -> dict:
    db = get_database()
    document = {
        **roadmap_data,
        "student_id": student_id,
        "created_at": datetime.now(timezone.utc),
    }
    if user_id:
        document["user_id"] = user_id
    result = await db.roadmaps.replace_one(
        {"student_id": student_id}, document, upsert=True
    )
    if result.upserted_id:
        document["_id"] = result.upserted_id
    else:
        existing = await db.roadmaps.find_one({"student_id": student_id})
        document["_id"] = existing["_id"]
    document["_id"] = str(document["_id"])
    return document


async def get_roadmap(student_id: str) -> dict:
    db = get_database()
    roadmap = await db.roadmaps.find_one({"student_id": student_id})
    if roadmap:
        roadmap["_id"] = str(roadmap["_id"])
    return roadmap


async def get_student(student_id: str) -> dict:
    db = get_database()
    if not ObjectId.is_valid(student_id):
        return None
    student = await db.students.find_one({"_id": ObjectId(student_id)})
    if student:
        student["_id"] = str(student["_id"])
    return student


async def resolve_student_id(user_id: str, requested_id: str) -> str | None:
    db = get_database()
    if requested_id == "me":
        return await ensure_student_for_user({"_id": user_id})

    student = await get_student(requested_id)
    if not student:
        return None
    if student.get("user_id") == user_id:
        return requested_id
    legacy_roadmap = await db.roadmaps.find_one(
        {"student_id": requested_id, "user_id": user_id}
    )
    if legacy_roadmap:
        return requested_id
    return None


async def mark_topic_completed(
    student_id: str, week_number: int, topic_order: int
) -> bool:
    db = get_database()
    # MongoDB array filter update
    result = await db.roadmaps.update_one(
        {"student_id": student_id},
        {"$set": {"weeks.$[w].topics.$[t].is_completed": True}},
        array_filters=[{"w.week_number": week_number}, {"t.order": topic_order}],
    )
    return result.modified_count > 0


async def get_todays_topic(student_id: str) -> dict:
    db = get_database()
    roadmap = await db.roadmaps.find_one({"student_id": student_id})
    if not roadmap:
        return None
    for week in roadmap.get("weeks", []):
        for topic in week.get("topics", []):
            if not topic.get("is_completed"):
                return {"week_number": week.get("week_number"), "topic": topic}
    return None
