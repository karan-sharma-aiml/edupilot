from fastapi import APIRouter, HTTPException, Request
from schemas.requests import GenerateRoadmapRequest, CompleteTopicRequest
from schemas.responses import StandardResponse
from services.roadmap_service import (
    create_student,
    create_roadmap,
    get_roadmap,
    get_todays_topic,
    mark_topic_completed,
    resolve_student_id,
)
from services.gemini_service import generate_roadmap as gemini_gen_roadmap

router = APIRouter(prefix="/api")


@router.post("/generate-roadmap", response_model=StandardResponse)
async def generate_roadmap_endpoint(req: Request, request: GenerateRoadmapRequest):
    try:
        user = getattr(req.state, "user", None)
        user_id = user["_id"] if user else None
        student_name = user["name"] if user else request.name

        # Create student first
        student_data = request.model_dump()
        if student_name:
            student_data["name"] = student_name

        student_id = await create_student(student_data, user_id)

        roadmap_json = await gemini_gen_roadmap(
            student_name,
            request.goal,
            request.daily_study_time,
            request.skill_level,
            request.learning_style,
        )

        roadmap = await create_roadmap(student_id, roadmap_json, user_id)

        return StandardResponse(
            success=True,
            data={"student_id": student_id, "roadmap": roadmap},
            message="Roadmap generated successfully",
        )
    except RuntimeError as e:
        message = str(e).lower()
        if any(
            token in message
            for token in ["quota", "rate limit", "429", "resource exhausted"]
        ):
            raise HTTPException(
                status_code=429,
                detail="AI provider quota exceeded. Please try again later.",
            )
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/roadmap/{student_id}", response_model=StandardResponse)
async def get_roadmap_endpoint(req: Request, student_id: str):
    try:
        user = getattr(req.state, "user", None)
        # We might want to look up by user_id instead of student_id if available, but for now just use student_id
        # Let's check both
        actual_id = (
            await resolve_student_id(user["_id"], student_id) if user else student_id
        )
        if not actual_id:
            raise HTTPException(status_code=404, detail="Student not found")
        roadmap = await get_roadmap(actual_id)

        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        return StandardResponse(
            success=True, data=roadmap, message="Roadmap fetched successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/todays-topic/{student_id}", response_model=StandardResponse)
async def get_todays_topic_endpoint(req: Request, student_id: str):
    try:
        user = getattr(req.state, "user", None)
        actual_id = (
            await resolve_student_id(user["_id"], student_id) if user else student_id
        )
        if not actual_id:
            raise HTTPException(status_code=404, detail="Student not found")
        topic = await get_todays_topic(actual_id)
        return StandardResponse(
            success=True, data=topic, message="Today's topic fetched successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/complete-topic", response_model=StandardResponse)
async def complete_topic_endpoint(req: Request, request: CompleteTopicRequest):
    try:
        user = getattr(req.state, "user", None)
        actual_id = (
            await resolve_student_id(user["_id"], request.student_id)
            if user
            else request.student_id
        )
        if not actual_id:
            raise HTTPException(status_code=404, detail="Student not found")
        success = await mark_topic_completed(
            actual_id, request.week_number, request.topic_order
        )
        if success:
            return StandardResponse(success=True, message="Topic marked as completed")
        else:
            raise HTTPException(
                status_code=400, detail="Failed to mark topic as completed"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
