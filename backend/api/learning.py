from fastapi import APIRouter, HTTPException, Request
import logging
import traceback
from schemas.requests import ExplainTopicRequest
from schemas.responses import StandardResponse
from services.gemini_service import explain_topic as gemini_explain_topic
from services.roadmap_service import get_student, resolve_student_id
from database import get_database
from datetime import datetime, timezone

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


@router.post("/explain-topic", response_model=StandardResponse)
async def explain_topic_endpoint(req: Request, request: ExplainTopicRequest):
    try:
        user = getattr(req.state, "user", None)
        actual_id = (
            await resolve_student_id(user["_id"], request.student_id)
            if user
            else request.student_id
        )
        if not actual_id:
            raise HTTPException(status_code=404, detail="Student not found")

        student = await get_student(actual_id)

        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        skill_level = student.get("skill_level", "beginner")
        explanation = await gemini_explain_topic(
            request.topic_title, request.context or "", skill_level
        )

        # Store session
        db = get_database()
        session = {
            "student_id": actual_id,
            "user_id": user["_id"] if user else None,
            "topic_title": request.topic_title,
            "explanation": explanation,
            "started_at": datetime.now(timezone.utc),
            "completed_at": datetime.now(timezone.utc),
        }
        await db.sessions.insert_one(session)

        return StandardResponse(
            success=True,
            data={"explanation": explanation},
            message="Explanation generated successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "Explain topic request failed for topic=%s", request.topic_title
        )
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
