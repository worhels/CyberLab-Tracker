from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberLab Tracker API"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    DATABASE_URL: str = Field(default="", min_length=1, validate_default=True)
    JWT_SECRET_KEY: str = Field(default="", min_length=1, validate_default=True)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    CORS_ALLOW_METHODS: list[str] = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    CORS_ALLOW_HEADERS: list[str] = ["Authorization", "Content-Type"]
    AUTH_RATE_LIMIT_REQUESTS: int = 5
    AUTH_RATE_LIMIT_WINDOW_SECONDS: int = 60
    OLLAMA_CHAT_URL: str = "http://localhost:11434/api/chat"
    OLLAMA_MODEL: str = "qwen2.5-coder:7b"
    OLLAMA_TIMEOUT_SECONDS: float = 120.0
    OLLAMA_WARMUP_ENABLED: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
