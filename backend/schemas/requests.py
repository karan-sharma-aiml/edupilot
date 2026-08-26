from pydantic import BaseModel, Field
from typing import List, Optional
from models.quiz import QuizAnswer


class GenerateRoadmapRequest(BaseModel):
    name: Optional[str] = None
    goal: str
    daily_study_time: int
    skill_level: str
    learning_style: str


class ExplainTopicRequest(BaseModel):
    student_id: str
    topic_title: str
    context: Optional[str] = None


class GenerateQuizRequest(BaseModel):
    student_id: str
    topic_title: str


class SubmitQuizRequest(BaseModel):
    student_id: str
    quiz_id: str
    answers: List[QuizAnswer]


class CompleteTopicRequest(BaseModel):
    student_id: str
    week_number: int
    topic_order: int


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    currentTopic: Optional[str] = None
    studentId: str = "me"
    history: List[ChatMessage] = Field(default_factory=list)


class NotesRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    studentId: str = "me"
