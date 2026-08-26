from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class SkillLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"

class LearningStyle(str, Enum):
    visual = "visual"
    reading = "reading"
    hands_on = "hands-on"
    mixed = "mixed"

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    goal: Optional[str] = None
    skill_level: Optional[SkillLevel] = None
    daily_study_time: Optional[int] = None
    learning_style: Optional[LearningStyle] = None
    area_of_interest: Optional[str] = None
    target_date: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    xp: int = 0
    level: int = 1
    streak: int = 0
    is_verified: bool = False
    is_onboarded: bool = False
    created_at: datetime
    last_login: Optional[datetime] = None
    # Settings
    theme: str = "dark"
    notifications_enabled: bool = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    goal: Optional[str] = None
    skill_level: Optional[SkillLevel] = None
    daily_study_time: Optional[int] = None
    learning_style: Optional[LearningStyle] = None
    area_of_interest: Optional[str] = None
    target_date: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserProfile

class OnboardingData(BaseModel):
    goal: str
    skill_level: SkillLevel
    daily_study_time: int
    learning_style: LearningStyle
    area_of_interest: Optional[str] = None
    target_date: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
