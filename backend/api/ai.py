from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from database import get_database
from schemas.requests import ChatRequest, NotesRequest
from schemas.responses import StandardResponse
from services.gemini_service import chat_response, generate_notes
from services.roadmap_service import get_student, resolve_student_id

router = APIRouter(prefix="/api", tags=["AI Tools"])


@router.post("/chat", response_model=StandardResponse)
async def chat_endpoint(request: ChatRequest, req: Request):
    user = req.state.user
    student_id = await resolve_student_id(user["_id"], request.studentId)
    if not student_id:
        raise HTTPException(status_code=404, detail="Student not found")
    student = await get_student(student_id)
    history = [message.model_dump() for message in request.history[-10:]]
    answer = await chat_response(
        request.message,
        history,
        f"Current topic: {request.currentTopic or 'General learning'}\nSkill level: {student.get('skill_level', 'beginner')}",
    )
    db = get_database()
    now = datetime.now(timezone.utc)
    await db.sessions.insert_one(
        {
            "student_id": student_id,
            "user_id": user["_id"],
            "topic_title": request.currentTopic or "AI Tutor",
            "message": request.message,
            "response": answer,
            "started_at": now,
            "completed_at": now,
        }
    )
    return StandardResponse(
        success=True, data={"response": answer}, message="Answer generated successfully"
    )


@router.post("/notes", response_model=StandardResponse)
async def notes_endpoint(request: NotesRequest, req: Request):
    user = req.state.user
    student_id = await resolve_student_id(user["_id"], request.studentId)
    if not student_id:
        raise HTTPException(status_code=404, detail="Student not found")
    student = await get_student(student_id)
    notes = await generate_notes(request.topic, student.get("skill_level", "beginner"))
    db = get_database()
    document = {
        "student_id": student_id,
        "user_id": user["_id"],
        "topic": request.topic,
        "content": notes,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.notes.insert_one(document)
    document["_id"] = str(result.inserted_id)
    return StandardResponse(
        success=True, data=document, message="Notes generated successfully"
    )
