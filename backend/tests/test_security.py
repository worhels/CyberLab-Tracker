from datetime import timedelta
from types import SimpleNamespace

import jwt
import pytest

from app.api.v1.endpoints.dashboard import build_crisis_metrics
from app.core.config import settings
from app.core.security import create_access_token, decode_access_token
from app.models.task import TaskPriority, TaskStatus


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


def test_crisis_metrics_use_all_tasks_but_count_active_pressure() -> None:
    tasks = [
        SimpleNamespace(status=TaskStatus.ACCEPTED, priority=TaskPriority.HIGH),
        SimpleNamespace(status=TaskStatus.ACCEPTED, priority=TaskPriority.CRITICAL),
        SimpleNamespace(status=TaskStatus.ACCEPTED, priority=TaskPriority.MEDIUM),
        SimpleNamespace(status=TaskStatus.NOT_STARTED, priority=TaskPriority.MEDIUM),
        SimpleNamespace(status=TaskStatus.SUBMITTED, priority=TaskPriority.MEDIUM),
    ]

    metrics = build_crisis_metrics(tasks)

    assert metrics["total_tasks"] == 5
    assert metrics["accepted_tasks"] == 3
    assert metrics["active_tasks"] == 2
    assert metrics["completion_ratio"] == 0.6
    assert metrics["cohesion_score"] == 0.6
    assert metrics["pressure_score"] == 0.3375
    assert metrics["instability_score"] == 0.2666
    assert metrics["severity_counts"] == {
        "critical": 0,
        "high": 0,
        "medium": 2,
        "low": 0,
    }
