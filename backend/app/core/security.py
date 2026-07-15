from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import settings


def password_bytes(password: str) -> bytes:
    encoded = password.encode("utf-8")
    if len(encoded) > 72:
        raise ValueError("Password must not exceed 72 bytes when UTF-8 encoded")
    return encoded


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password_bytes(plain_password), hashed_password.encode("ascii"))
    except (UnicodeEncodeError, ValueError):
        return False


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(
        password_bytes(password),
        bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS),
    ).decode("ascii")


def create_access_token(subject: str | int, expires_delta: timedelta | None = None) -> str:
    issued_at = datetime.now(timezone.utc)
    expire = issued_at + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    payload: dict[str, Any] = {
        "exp": expire,
        "iat": issued_at,
        "sub": str(subject),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require": ["exp", "iat", "sub", "type"]},
    )
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Invalid token type")
    return payload
