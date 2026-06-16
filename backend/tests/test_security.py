from datetime import timedelta

import jwt
import pytest

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token


def test_access_token_contains_required_claims() -> None:
    token = create_access_token(subject=123, expires_delta=timedelta(minutes=5))

    payload = decode_access_token(token)

    assert payload["sub"] == "123"
    assert payload["type"] == "access"
    assert "exp" in payload
    assert "iat" in payload


def test_decode_rejects_wrong_token_type() -> None:
    token = jwt.encode(
        {
            "sub": "123",
            "type": "refresh",
            "exp": 4_102_444_800,
            "iat": 1_704_067_200,
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)


def test_decode_rejects_missing_required_claim() -> None:
    token = jwt.encode(
        {
            "sub": "123",
            "type": "access",
            "exp": 4_102_444_800,
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    with pytest.raises(jwt.MissingRequiredClaimError):
        decode_access_token(token)
