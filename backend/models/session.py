from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class LearningSession(BaseModel):
    id: str = Field(alias="_id")
    student_id: str
    topic_title: str
    explanation: str
    started_at: datetime
    completed_at: Optional[datetime] = None
