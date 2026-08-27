from fastapi import APIRouter, HTTPException, Request
import logging
import traceback
from schemas.responses import StandardResponse, DashboardResponse
from services.dashboard_service import get_dashboard
from services.roadmap_service import resolve_student_id

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


@router.get("/dashboard/{student_id}", response_model=StandardResponse)
async def get_dashboard_endpoint(req: Request, student_id: str):
    try:
        user = getattr(req.state, "user", None)
        actual_id = (
            await resolve_student_id(user["_id"], student_id) if user else student_id
        )
        if not actual_id:
            raise HTTPException(status_code=404, detail="Student not found")

        dashboard_data = await get_dashboard(actual_id)
        return StandardResponse(
            success=True, data=dashboard_data, message="Dashboard fetched successfully"
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Dashboard request failed for student_id=%s", student_id)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
