from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager
from database import db
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from api import roadmap, learning, quiz, dashboard, auth, ai
from middleware.auth_middleware import AuthMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.client = AsyncIOMotorClient(settings.MONGODB_URI)
    # Create indexes
    database = db.client[settings.MONGODB_DB]
    await database.users.create_index("email", unique=True)
    await database.users.create_index("verification_token")
    await database.users.create_index("reset_token")
    await database.roadmaps.create_index("student_id")  # Keep legacy
    await database.roadmaps.create_index("user_id")  # New
    await database.sessions.create_index("student_id")
    await database.sessions.create_index("user_id")
    await database.quiz_results.create_index("student_id")
    await database.quiz_results.create_index("user_id")
    await database.notes.create_index("student_id")
    await database.notes.create_index("user_id")
    await database.learning_dna.create_index("student_id")
    await database.learning_dna.create_index("user_id")
    yield
    db.client.close()


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
