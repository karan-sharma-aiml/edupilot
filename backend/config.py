from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "openai/gpt-4o-mini"
    MONGODB_URI: str = ""
    MONGODB_DB: str = ""
    BACKEND_URL: str = ""
    FRONTEND_URL: str = ""
    ALLOWED_ORIGINS: str = ""

    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "your-email@gmail.com"
    SMTP_PASSWORD: str = "your-app-password"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).with_name(".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("MONGODB_URI")
    @classmethod
    def validate_mongodb_uri(cls, value: str) -> str:
        value = value.strip()
        if not value or value.startswith("MONGODB_URI="):
            return ""
        if not value.startswith(("mongodb://", "mongodb+srv://")):
            raise ValueError("MONGODB_URI must start with mongodb:// or mongodb+srv://")
        return value

    @field_validator("MONGODB_DB")
    @classmethod
    def validate_mongodb_db(cls, value: str) -> str:
        return value.strip()

    @field_validator("FRONTEND_URL", "BACKEND_URL")
    @classmethod
    def validate_http_url(cls, value: str) -> str:
        value = value.strip()
        if not value:
            return ""
        if not value.startswith(("http://", "https://")):
            raise ValueError("URL values must start with http:// or https://")
        return value.rstrip("/")

    def get_allowed_origins(self) -> list[str]:
        origins = []
        for candidate in [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://edupilot-frontend-eight.vercel.app",
            self.FRONTEND_URL,
            self.BACKEND_URL,
            self.ALLOWED_ORIGINS,
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
        ]:
            if not candidate:
                continue
            for origin in str(candidate).split(","):
                origin = origin.strip().rstrip("/")
                if origin and origin not in origins:
                    origins.append(origin)
        return origins


settings = Settings()
