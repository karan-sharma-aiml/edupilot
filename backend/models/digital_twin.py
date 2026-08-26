from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any, Dict, List, Optional


class LearningPrediction(BaseModel):
    text: str
    priority: str = "medium"
    reason: str


class LearningHealth(BaseModel):
    score: int
    label: str
    summary: str


class LearningDNA(BaseModel):
    student_id: str
    learning_personality: str
    learning_speed: str
    retention_score: int
    confidence_score: int
    revision_need: str
    most_improved_skill: str
    current_weakness: str
    current_strength: str
    recommended_study_style: str
    best_time_to_study: str
    estimated_time_to_goal: str
    learning_momentum: str
    learning_health: LearningHealth
    predictions: List[LearningPrediction]
    updated_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    metadata: Optional[Dict[str, Any]] = None
