from fastapi import APIRouter, HTTPException, Request
from schemas.requests import GenerateQuizRequest, SubmitQuizRequest
from schemas.responses import StandardResponse
from services.gemini_service import generate_quiz as gemini_gen_quiz
from services.quiz_service import create_quiz, submit_quiz as process_submit_quiz
from services.roadmap_service import get_student, resolve_student_id

router = APIRouter(prefix="/api")


@router.post("/generate-quiz", response_model=StandardResponse)
async def generate_quiz_endpoint(req: Request, request: GenerateQuizRequest):
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
        questions = await gemini_gen_quiz(request.topic_title, skill_level)

        quiz = await create_quiz(actual_id, request.topic_title, questions)

        return StandardResponse(
            success=True, data=quiz, message="Quiz generated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit-quiz", response_model=StandardResponse)
async def submit_quiz_endpoint(req: Request, request: SubmitQuizRequest):
    try:
        user = getattr(req.state, "user", None)
        actual_id = (
            await resolve_student_id(user["_id"], request.student_id)
            if user
            else request.student_id
        )
        if not actual_id:
            raise HTTPException(status_code=404, detail="Student not found")
        answers = [a.model_dump() for a in request.answers]
        result = await process_submit_quiz(actual_id, request.quiz_id, answers)
        return StandardResponse(
            success=True, data=result, message="Quiz submitted successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
