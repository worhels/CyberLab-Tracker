from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberLab Tracker API"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    DATABASE_URL: str = Field(default="", min_length=1, validate_default=True)
    JWT_SECRET_KEY: str = Field(default="", min_length=32, validate_default=True)
    JWT_ALGORITHM: Literal["HS256"] = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24, gt=0)
    BCRYPT_ROUNDS: int = Field(default=12, ge=12, le=16)
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    CORS_ALLOW_METHODS: list[str] = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    CORS_ALLOW_HEADERS: list[str] = ["Authorization", "Content-Type"]
    AUTH_RATE_LIMIT_REQUESTS: int = 5
    AUTH_RATE_LIMIT_WINDOW_SECONDS: int = 60
    OLLAMA_CHAT_URL: str = "http://localhost:11434/api/chat"
    OLLAMA_MODEL: str = "qwen3-coder:30b"
    OLLAMA_ARTIFACT_MODEL: str = "qwen3-coder:30b"
    OLLAMA_TIMEOUT_SECONDS: float = 120.0
    OLLAMA_ARTIFACT_TIMEOUT_SECONDS: float = 240.0
    OLLAMA_CONTEXT_LENGTH: int = Field(default=8_192, ge=2_048, le=65_536)
    OLLAMA_KEEP_ALIVE: str = "2h"
    OLLAMA_WARMUP_ENABLED: bool = True
    MENTOR_ARTIFACT_ROOT: Path = Path.home() / ".cyberlab-tracker" / "mentor-artifacts"
    MENTOR_ARTIFACT_MAX_PER_USER: int = Field(default=20, ge=1, le=100)

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def reject_placeholder_jwt_secret(cls, value: str) -> str:
        if value == "replace-with-a-long-random-secret":
            raise ValueError("JWT_SECRET_KEY must be replaced with a random secret")
        return value

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
