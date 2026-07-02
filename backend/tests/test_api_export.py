import csv
from datetime import datetime, timezone
from io import StringIO

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.subject import Subject
from app.models.task import Task, TaskPriority, TaskStatus, TaskType
from app.models.user import User


def create_user(db: Session, email: str) -> User:
    user = User(email=email, hashed_password="unused-test-hash", full_name=email.split("@")[0])
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_subject(db: Session, user: User, name: str) -> Subject:
    subject = Subject(
        name=name,
        color="#d8655b",
        teacher="Export Teacher",
        semester="Spring 2026",
        description="Export subject description",
        user_id=user.id,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def create_task(db: Session, subject: Subject, title: str) -> Task:
    timestamp = datetime(2026, 7, 2, 12, 0, tzinfo=timezone.utc)
    task = Task(
        title=title,
        description="Export task description",
        deadline=timestamp,
        subject_id=subject.id,
        type=TaskType.LAB,
        status=TaskStatus.ACCEPTED,
        priority=TaskPriority.HIGH,
        estimated_hours=4,
        github_url="https://github.com/example/export-task",
        submitted_at=timestamp,
        accepted_at=timestamp,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def auth_headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def test_json_export_contains_only_current_users_workspace(
    client: TestClient,
    db_session: Session,
) -> None:
    owner = create_user(db_session, "export-owner@example.com")
    outsider = create_user(db_session, "export-outsider@example.com")
    owner_subject = create_subject(db_session, owner, "Криптографія")
    outsider_subject = create_subject(db_session, outsider, "Private outsider subject")
    create_task(db_session, owner_subject, "Owner export task")
    create_task(db_session, outsider_subject, "Private outsider task")

    response = client.get("/api/v1/export/json", headers=auth_headers(owner))

    assert response.status_code == 200
    assert response.headers["content-disposition"].startswith(
        'attachment; filename="cyberlab-export-'
    )
    assert response.headers["content-disposition"].endswith('.json"')

    payload = response.json()
    assert datetime.fromisoformat(payload["exported_at"]).tzinfo is not None
    assert [subject["name"] for subject in payload["subjects"]] == ["Криптографія"]
    assert [task["title"] for task in payload["tasks"]] == ["Owner export task"]
    assert payload["subjects"][0]["user_id"] == owner.id
    assert payload["subjects"][0]["created_at"]
    assert payload["subjects"][0]["updated_at"]
    assert payload["tasks"][0]["created_at"]
    assert payload["tasks"][0]["updated_at"]
    assert payload["tasks"][0]["submitted_at"]
    assert payload["tasks"][0]["accepted_at"]


def test_csv_export_contains_subjects_tasks_and_timestamps(
    client: TestClient,
    db_session: Session,
) -> None:
    owner = create_user(db_session, "csv-owner@example.com")
    outsider = create_user(db_session, "csv-outsider@example.com")
    owner_subject = create_subject(db_session, owner, "Мережева безпека")
    outsider_subject = create_subject(db_session, outsider, "Outsider CSV subject")
    owner_task = create_task(db_session, owner_subject, "CSV packet report")
    create_task(db_session, outsider_subject, "Outsider CSV task")

    response = client.get("/api/v1/export/csv", headers=auth_headers(owner))

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert response.headers["content-disposition"].startswith(
        'attachment; filename="cyberlab-export-'
    )
    assert response.headers["content-disposition"].endswith('.csv"')
    assert response.content.startswith(b"\xef\xbb\xbf")

    csv_text = response.content.decode("utf-8-sig")
    rows = list(csv.DictReader(StringIO(csv_text)))

    assert [row["record_type"] for row in rows] == ["subject", "task"]
    subject_row, task_row = rows
    assert subject_row["name"] == "Мережева безпека"
    assert subject_row["user_id"] == str(owner.id)
    assert subject_row["created_at"]
    assert subject_row["updated_at"]
    assert task_row["title"] == "CSV packet report"
    assert task_row["subject_id"] == str(owner_subject.id)
    assert task_row["id"] == str(owner_task.id)
    assert task_row["deadline"]
    assert task_row["submitted_at"]
    assert task_row["accepted_at"]
    assert task_row["created_at"]
    assert task_row["updated_at"]
    assert all(row["exported_at"] for row in rows)
    assert "Outsider CSV" not in csv_text


def test_export_endpoints_require_authentication(client: TestClient) -> None:
    assert client.get("/api/v1/export/json").status_code == 401
    assert client.get("/api/v1/export/csv").status_code == 401
