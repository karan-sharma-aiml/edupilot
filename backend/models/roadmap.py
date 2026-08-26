from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class Topic(BaseModel):
    title: str
    description: str
    estimated_minutes: int
    order: int
    is_completed: bool = False

class Week(BaseModel):
    week_number: int
    title: str
    topics: List[Topic]
    is_current: bool = False

class Milestone(BaseModel):
    title: str
    week_number: int
    description: str

class RoadmapDocument(BaseModel):
    id: str = Field(alias="_id")
    student_id: str
    weeks: List[Week]
    milestones: List[Milestone]
    total_weeks: int
    created_at: datetime
