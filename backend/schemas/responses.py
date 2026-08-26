from pydantic import BaseModel
from typing import Any, Optional, List

class StandardResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: str

class DashboardResponse(BaseModel):
    student: dict
    roadmap_progress: dict
    quiz_scores: List[dict]
    weak_topics: List[str]
    completed_topics: List[str]
    learning_streak: int
    next_recommendation: Optional[dict] = None
