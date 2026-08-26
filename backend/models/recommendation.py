from pydantic import BaseModel, Field
from datetime import datetime

class Recommendation(BaseModel):
    id: str = Field(alias="_id")
    student_id: str
    type: str
    topic_title: str
    reason: str
    created_at: datetime
