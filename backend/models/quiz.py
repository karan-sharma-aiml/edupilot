from pydantic import BaseModel, Field
from datetime import datetime
from typing import List

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int
    explanation: str

class Quiz(BaseModel):
    id: str = Field(alias="_id")
    student_id: str
    topic_title: str
    questions: List[QuizQuestion]
    created_at: datetime

class QuizAnswer(BaseModel):
    question_index: int
    selected_answer: int

class QuizResult(BaseModel):
    id: str = Field(alias="_id")
    student_id: str
    quiz_id: str
    topic_title: str
    score: int
    total: int
    answers: List[dict]
    created_at: datetime
