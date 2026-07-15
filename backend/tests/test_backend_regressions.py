import json
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import Settings, settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.subject import Subject
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.user import User
from app.schemas.subject import SubjectUpdate
from app.schemas.task import TaskCreate, TaskUpdate
from app.schemas.user import UserCreate
from app.schemas.user_settings import UserSettingsUpdate


VALID_SETTINGS = {
    "DATABASE_URL": "sqlite+pysqlite:///:memory:",
    "JWT_SECRET_KEY": "x" * 32,
}


def create_user(db: Session, email: str) -> User:
    user = User(email=email, hashed_password="unused-test-hash")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_subject(db: Session, user: User, name: str) -> Subject:
    subject = Subject(
        name=name,
        color="#4f46e5",
        teacher="Dr. Test",
        semester="Spring 2026",
        description="Nullable subject metadata",
        user_id=user.id,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def auth_headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


@pytest.mark.parametrize(
    "override",
    [
        {"JWT_SECRET_KEY": "too-short"},
        {"JWT_SECRET_KEY": "replace-with-a-long-random-secret"},
        {"JWT_ALGORITHM": "HS384"},
        {"ACCESS_TOKEN_EXPIRE_MINUTES": 0},
        {"BCRYPT_ROUNDS": 11},
        {"BCRYPT_ROUNDS": 17},
    ],
)
def test_security_settings_reject_unsafe_values(override: dict[str, object]) -> None:
    values = {**VALID_SETTINGS, **override}
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **values)


def test_bcrypt_enforces_rounds_and_72_byte_boundary() -> None:
    password = "a" * 72
    password_hash = get_password_hash(password)

    assert int(password_hash.split("$")[2]) == settings.BCRYPT_ROUNDS
    assert verify_password(password, password_hash) is True
    assert verify_password(f"{password}b", password_hash) is False

    with pytest.raises(ValueError, match="72 bytes"):
        get_password_hash(f"{password}b")

    UserCreate(email="boundary@example.com", password="é" * 36)
    with pytest.raises(ValidationError, match="72 bytes"):
        UserCreate(email="too-long@example.com", password=("é" * 36) + "a")


@pytest.mark.parametrize("field", ["deadline", "submitted_at", "accepted_at"])
def test_task_schemas_reject_naive_input_datetimes(field: str) -> None:
    create_payload: dict[str, object] = {
        "title": "Timezone validation",
        "subject_id": 1,
        field: datetime(2026, 7, 15, 12, 0),
    }
    update_payload = {field: datetime(2026, 7, 15, 12, 0)}

    with pytest.raises(ValidationError, match="UTC offset"):
        TaskCreate(**create_payload)
    with pytest.raises(ValidationError, match="UTC offset"):
        TaskUpdate(**update_payload)


def test_task_schemas_normalize_aware_input_datetimes_to_utc() -> None:
    local_time = datetime(2026, 7, 15, 18, 30, tzinfo=timezone(timedelta(hours=3)))
    task = TaskCreate(
        title="UTC normalization",
        subject_id=1,
        deadline=local_time,
        submitted_at=local_time,
        accepted_at=local_time,
    )

    expected = datetime(2026, 7, 15, 15, 30, tzinfo=timezone.utc)
    assert task.deadline == expected
    assert task.submitted_at == expected
    assert task.accepted_at == expected


@pytest.mark.parametrize(
    ("schema", "field"),
    [
        (SubjectUpdate, "name"),
        (SubjectUpdate, "color"),
        (TaskUpdate, "title"),
        (TaskUpdate, "subject_id"),
        (TaskUpdate, "type"),
        (TaskUpdate, "priority"),
        (TaskUpdate, "status"),
        (UserSettingsUpdate, "language"),
        (UserSettingsUpdate, "show_crisis_cube"),
    ],
)
def test_update_schemas_reject_explicit_null_for_non_nullable_fields(
    schema: type[SubjectUpdate] | type[TaskUpdate] | type[UserSettingsUpdate],
    field: str,
) -> None:
    with pytest.raises(ValidationError, match="cannot be null"):
        schema(**{field: None})

    property_schema = schema.model_json_schema()["properties"][field]
    assert '"null"' not in json.dumps(property_schema)


def test_update_schemas_keep_nullable_fields_clearable() -> None:
    subject_update = SubjectUpdate(teacher=None, semester=None, description=None)
    task_update = TaskUpdate(
        description=None,
        deadline=None,
        github_url=None,
        moodle_url=None,
        report_file=None,
        estimated_hours=None,
        submitted_at=None,
        accepted_at=None,
    )

    assert subject_update.model_dump(exclude_unset=True) == {
        "teacher": None,
        "semester": None,
        "description": None,
    }
    assert all(value is None for value in task_update.model_dump(exclude_unset=True).values())


def test_task_and_subject_api_contracts_reject_null_and_allow_clearing(
    client: TestClient,
    db_session: Session,
) -> None:
    user = create_user(db_session, "nullable-contracts@example.com")
    subject = create_subject(db_session, user, "Nullable contracts")
    headers = auth_headers(user)
    task_payload = {
        "title": "Clear nullable fields",
        "description": "Temporary description",
        "deadline": "2026-07-15T18:30:00+03:00",
        "subject_id": subject.id,
        "github_url": "https://github.com/example/repository",
        "moodle_url": "https://moodle.example/course",
        "report_file": "report.pdf",
        "estimated_hours": 4,
        "submitted_at": "2026-07-15T18:30:00+03:00",
        "accepted_at": "2026-07-15T18:30:00+03:00",
    }
    create_response = client.post("/api/v1/tasks", headers=headers, json=task_payload)
    assert create_response.status_code == 201
    task_id = create_response.json()["id"]

    for field in ("title", "subject_id", "type", "priority", "status"):
        response = client.put(f"/api/v1/tasks/{task_id}", headers=headers, json={field: None})
        assert response.status_code == 422

    for field in ("name", "color"):
        response = client.put(f"/api/v1/subjects/{subject.id}", headers=headers, json={field: None})
        assert response.status_code == 422

    assert client.patch("/api/v1/settings/me", headers=headers, json={"theme": None}).status_code == 422

    clear_task_response = client.put(
        f"/api/v1/tasks/{task_id}",
        headers=headers,
        json={
            "description": None,
            "deadline": None,
            "github_url": None,
            "moodle_url": None,
            "report_file": None,
            "estimated_hours": None,
            "submitted_at": None,
            "accepted_at": None,
        },
    )
    assert clear_task_response.status_code == 200
    assert all(
        clear_task_response.json()[field] is None
        for field in (
            "description",
            "deadline",
            "github_url",
            "moodle_url",
            "report_file",
            "estimated_hours",
            "submitted_at",
            "accepted_at",
        )
    )

    clear_subject_response = client.put(
        f"/api/v1/subjects/{subject.id}",
        headers=headers,
        json={"teacher": None, "semester": None, "description": None},
    )
    assert clear_subject_response.status_code == 200
    assert clear_subject_response.json()["teacher"] is None
    assert clear_subject_response.json()["semester"] is None
    assert clear_subject_response.json()["description"] is None


@pytest.mark.parametrize("field", ["deadline", "submitted_at", "accepted_at"])
def test_task_api_rejects_naive_input_datetimes(
    field: str,
    client: TestClient,
    db_session: Session,
) -> None:
    user = create_user(db_session, f"naive-{field}@example.com")
    subject = create_subject(db_session, user, f"Naive {field}")
    payload = {
        "title": "Naive datetime",
        "subject_id": subject.id,
        field: "2026-07-15T18:30:00",
    }

    response = client.post("/api/v1/tasks", headers=auth_headers(user), json=payload)

    assert response.status_code == 422


def test_crisis_endpoint_includes_debt_as_active_pressure(
    client: TestClient,
    db_session: Session,
) -> None:
    user = create_user(db_session, "crisis-debt@example.com")
    subject = create_subject(db_session, user, "Crisis debt")
    debt_task = Task(
        title="Overdue debt",
        subject_id=subject.id,
        status=TaskStatus.DEBT,
        priority=TaskPriority.CRITICAL,
        deadline=datetime.now(timezone.utc) - timedelta(days=2),
    )
    db_session.add(debt_task)
    db_session.commit()

    response = client.get("/api/v1/dashboard/crisis", headers=auth_headers(user))

    assert response.status_code == 200
    payload = response.json()
    assert payload["active_tasks"] == 1
    assert payload["severity_counts"]["critical"] == 1
    assert [task["title"] for task in payload["tasks"]] == ["Overdue debt"]
    assert payload["tasks"][0]["crisis_score"] >= 240
