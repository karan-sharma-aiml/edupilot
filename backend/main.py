from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager
import logging
from database import db, ensure_index
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from api import roadmap, learning, quiz, dashboard, auth, ai
from middleware.auth_middleware import AuthMiddleware

logger = logging.getLogger("edupilot.mongodb")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
        )
        database = db.client[settings.MONGODB_DB]
        await database.command("ping")
        logger.info("✅ MongoDB Connected: database=%s", settings.MONGODB_DB)

        await ensure_index(database.users, [("email", 1)], unique=True)
        await ensure_index(database.users, [("verification_token", 1)])
        await ensure_index(database.users, [("reset_token", 1)])
        await ensure_index(database.roadmaps, [("student_id", 1)])
        await ensure_index(database.roadmaps, [("user_id", 1)])
        await ensure_index(database.sessions, [("student_id", 1)])
        await ensure_index(database.sessions, [("user_id", 1)])
        await ensure_index(database.quiz_results, [("student_id", 1)])
        await ensure_index(database.quiz_results, [("user_id", 1)])
        await ensure_index(database.notes, [("student_id", 1)])
        await ensure_index(database.notes, [("user_id", 1)])
        await ensure_index(database.learning_dna, [("student_id", 1)])
        await ensure_index(database.learning_dna, [("user_id", 1)])
        await ensure_index(database.ai_cache, [("key", 1)], unique=True)
        await ensure_index(
            database.quiz_results, [("student_id", 1), ("created_at", -1)]
        )
        await ensure_index(
            database.recommendations, [("student_id", 1), ("created_at", -1)]
        )
        await ensure_index(database.sessions, [("student_id", 1), ("started_at", -1)])
        await ensure_index(database.learning_dna, [("student_id", 1)], unique=True)
    except Exception:
        logger.exception("❌ MongoDB Connection Failed")
        if db.client is not None:
            db.client.close()
        db.client = None
        raise
    yield
    db.client.close()
    db.client = None


app = FastAPI(title="EduPilot API", lifespan=lifespan)

# Auth middleware
app.add_middleware(AuthMiddleware)

# CORS must wrap auth so rejected requests still include browser-readable CORS headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler for middleware HTTPExceptions
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail, "data": None},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception for %s %s", request.method, request.url.path)
    import traceback

    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": str(exc), "data": None},
    )


# Routers
app.include_router(auth.router)
app.include_router(roadmap.router)
app.include_router(learning.router)
app.include_router(quiz.router)
app.include_router(dashboard.router)
app.include_router(ai.router)


@app.get("/")
async def root():
    return {"status": "ok", "message": "EduPilot API is running"}


@app.get("/api/health")
async def health():
    return {"status": "healthy"}
