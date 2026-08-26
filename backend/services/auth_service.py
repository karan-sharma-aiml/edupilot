import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from typing import Optional
import secrets
from database import get_database
from config import settings


# Password hashing
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


# JWT tokens
def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": user_id, "exp": expire, "type": "access"}
    return jwt.encode(
        payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def create_refresh_token(user_id: str, remember_me: bool = False) -> str:
    days = (
        settings.REFRESH_TOKEN_EXPIRE_DAYS * 4
        if remember_me
        else settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    expire = datetime.now(timezone.utc) + timedelta(days=days)
    payload = {"sub": user_id, "exp": expire, "type": "refresh"}
    return jwt.encode(
        payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        return None


def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)


# User CRUD
async def create_user(name: str, email: str, password: str) -> dict:
    db = get_database()
    # Check if email already exists
    existing = await db.users.find_one({"email": email.lower()})
    if existing:
        raise ValueError("Email already registered")

    verification_token = generate_verification_token()
    user = {
        "name": name,
        "email": email.lower(),
        "password": hash_password(password),
        "avatar": None,
        "goal": None,
        "skill_level": None,
        "daily_study_time": None,
        "learning_style": None,
        "area_of_interest": None,
        "target_date": None,
        "country": None,
        "timezone": None,
        "xp": 0,
        "level": 1,
        "streak": 0,
        "is_verified": False,
        "is_onboarded": False,
        "verification_token": verification_token,
        "reset_token": None,
        "reset_token_expires": None,
        "theme": "dark",
        "notifications_enabled": True,
        "created_at": datetime.now(timezone.utc),
        "last_login": None,
    }
    result = await db.users.insert_one(user)
    user["_id"] = str(result.inserted_id)
    return user, verification_token


async def authenticate_user(email: str, password: str) -> dict:
    db = get_database()
    user = await db.users.find_one({"email": email.lower()})
    if not user or not verify_password(password, user["password"]):
        return None
    # Update last login
    await db.users.update_one(
        {"_id": user["_id"]}, {"$set": {"last_login": datetime.now(timezone.utc)}}
    )
    user["_id"] = str(user["_id"])
    return user


async def get_user_by_id(user_id: str) -> dict:
    db = get_database()
    if not ObjectId.is_valid(user_id):
        return None
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user:
        user["_id"] = str(user["_id"])
    return user


async def verify_email(token: str) -> bool:
    db = get_database()
    result = await db.users.update_one(
        {"verification_token": token},
        {"$set": {"is_verified": True, "verification_token": None}},
    )
    return result.modified_count > 0


async def create_reset_token(email: str) -> Optional[str]:
    db = get_database()
    token = generate_verification_token()
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    result = await db.users.update_one(
        {"email": email.lower()},
        {"$set": {"reset_token": token, "reset_token_expires": expires}},
    )
    if result.modified_count > 0:
        return token
    return None


async def reset_password(token: str, new_password: str) -> bool:
    db = get_database()
    user = await db.users.find_one(
        {
            "reset_token": token,
            "reset_token_expires": {"$gt": datetime.now(timezone.utc)},
        }
    )
    if not user:
        return False
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password": hash_password(new_password),
                "reset_token": None,
                "reset_token_expires": None,
            }
        },
    )
    return True


async def update_user(user_id: str, data: dict) -> dict:
    db = get_database()
    # Remove None values
    update_data = {k: v for k, v in data.items() if v is not None}
    if update_data:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    user = await get_user_by_id(user_id)
    return user


def format_user_profile(user: dict) -> dict:
    """Strip sensitive fields and format for API response"""
    return {
        "id": user.get("_id") or str(user.get("id", "")),
        "name": user.get("name"),
        "email": user.get("email"),
        "avatar": user.get("avatar"),
        "goal": user.get("goal"),
        "skill_level": user.get("skill_level"),
        "daily_study_time": user.get("daily_study_time"),
        "learning_style": user.get("learning_style"),
        "area_of_interest": user.get("area_of_interest"),
        "target_date": user.get("target_date"),
        "country": user.get("country"),
        "timezone": user.get("timezone"),
        "xp": user.get("xp", 0),
        "level": user.get("level", 1),
        "streak": user.get("streak", 0),
        "is_verified": user.get("is_verified", False),
        "is_onboarded": user.get("is_onboarded", False),
        "created_at": user.get("created_at"),
        "last_login": user.get("last_login"),
        "theme": user.get("theme", "dark"),
        "notifications_enabled": user.get("notifications_enabled", True),
    }
