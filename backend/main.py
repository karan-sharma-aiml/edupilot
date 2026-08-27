from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.gzip import GZipMiddleware

from api import ai, auth, dashboard, learning, quiz, roadmap
from config import settings
from database import db, ensure_index
from middleware.auth_middleware import AuthMiddleware

logger = logging.getLogger("edupilot.mongodb")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.MONGODB_URI or not settings.MONGODB_DB:
        logger.warning(
            "MongoDB not configured for startup. Set MONGODB_URI and MONGODB_DB in the environment."
        )
        db.client = None
        yield
        return

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
        logger.exception(
            "❌ MongoDB connection failed. Application will continue without a database connection."
        )
        if db.client is not None:
            db.client.close()
        db.client = None
    yield
    if db.client is not None:
        db.client.close()
        db.client = None


app = FastAPI(title="EduPilot API", lifespan=lifespan)

app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(AuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
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


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/health")
async def api_health():
    return {"status": "ok"}
