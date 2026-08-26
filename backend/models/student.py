
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class StudentCreate(BaseModel):
    name: str
    goal: str
    daily_study_time: int
    skill_level: str
    learning_style: str

class StudentDocument(StudentCreate):
    id: str = Field(alias="_id")
    created_at: datetime
