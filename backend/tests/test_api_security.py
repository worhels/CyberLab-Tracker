from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.models.subject import Subject
from app.models.task import Task
from app.models.user import User


def create_user(db: Session, email: str) -> User:
    user = User(email=email, hashed_password="unused-test-hash", full_name=email.split("@")[0])
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_subject(db: Session, user: User, name: str) -> Subject:
    subject = Subject(name=name, user_id=user.id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def create_task(db: Session, subject: Subject, title: str) -> Task:
    task = Task(title=title, subject_id=subject.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def auth_headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def test_auth_me_rejects_expired_token(client: TestClient, db_session: Session) -> None:
    user = create_user(db_session, "expired@example.com")
    token = create_access_token(user.id, expires_delta=timedelta(seconds=-1))

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Could not validate credentials"}
    assert response.headers["www-authenticate"] == "Bearer"


def test_auth_me_rejects_malformed_token(client: TestClient) -> None:
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer definitely-not-a-jwt"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Could not validate credentials"}
    assert response.headers["www-authenticate"] == "Bearer"


def test_register_login_and_read_current_user(client: TestClient) -> None:
    credentials = {
        "email": "integration@example.com",
        "password": "correct-horse-battery-staple",
        "full_name": "Integration User",
    }

    register_response = client.post("/api/v1/auth/register", json=credentials)
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": credentials["email"], "password": credentials["password"]},
    )
    token = login_response.json()["access_token"]
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert register_response.status_code == 201
    assert register_response.json()["email"] == credentials["email"]
    assert "password" not in register_response.json()
    assert login_response.status_code == 200
    assert login_response.json()["token_type"] == "bearer"
    assert me_response.status_code == 200
    assert me_response.json()["email"] == credentials["email"]
    assert me_response.json()["full_name"] == credentials["full_name"]


def test_login_rate_limit_returns_429(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "AUTH_RATE_LIMIT_REQUESTS", 2)
    payload = {"username": "missing@example.com", "password": "not-the-password"}

    assert client.post("/api/v1/auth/login", data=payload).status_code == 401
    assert client.post("/api/v1/auth/login", data=payload).status_code == 401

    response = client.post("/api/v1/auth/login", data=payload)

    assert response.status_code == 429
    assert response.json() == {"detail": "Too many authentication attempts"}


def test_register_rate_limit_returns_429(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "AUTH_RATE_LIMIT_REQUESTS", 1)

    first_response = client.post(
        "/api/v1/auth/register",
        json={"email": "first@example.com", "password": "correct-horse-battery-staple"},
    )
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "second@example.com", "password": "correct-horse-battery-staple"},
    )

    assert first_response.status_code == 201
    assert response.status_code == 429
    assert response.json() == {"detail": "Too many authentication attempts"}


def test_subject_endpoints_hide_another_users_subject(
    client: TestClient,
    db_session: Session,
) -> None:
    owner = create_user(db_session, "subject-owner@example.com")
    attacker = create_user(db_session, "subject-attacker@example.com")
    private_subject = create_subject(db_session, owner, "Private subject")
    headers = auth_headers(attacker)

    list_response = client.get("/api/v1/subjects", headers=headers)

    assert list_response.status_code == 200
    assert list_response.json() == []
    assert client.get(f"/api/v1/subjects/{private_subject.id}", headers=headers).status_code == 404
    assert (
        client.put(
            f"/api/v1/subjects/{private_subject.id}",
            headers=headers,
            json={"name": "Hijacked"},
        ).status_code
        == 404
    )
    assert client.delete(f"/api/v1/subjects/{private_subject.id}", headers=headers).status_code == 404

    db_session.refresh(private_subject)
    assert private_subject.name == "Private subject"


def test_task_endpoints_hide_another_users_task(
    client: TestClient,
    db_session: Session,
) -> None:
    owner = create_user(db_session, "task-owner@example.com")
    attacker = create_user(db_session, "task-attacker@example.com")
    private_subject = create_subject(db_session, owner, "Owner subject")
    private_task = create_task(db_session, private_subject, "Private task")
    headers = auth_headers(attacker)

    list_response = client.get("/api/v1/tasks", headers=headers)

    assert list_response.status_code == 200
    assert list_response.json() == []
    assert client.get(f"/api/v1/tasks/{private_task.id}", headers=headers).status_code == 404
    assert (
        client.put(
            f"/api/v1/tasks/{private_task.id}",
            headers=headers,
            json={"title": "Hijacked"},
        ).status_code
        == 404
    )
    assert (
        client.patch(
            f"/api/v1/tasks/{private_task.id}/status",
            headers=headers,
            json={"status": "accepted"},
        ).status_code
        == 404
    )
    assert client.delete(f"/api/v1/tasks/{private_task.id}", headers=headers).status_code == 404

    db_session.refresh(private_task)
    assert private_task.title == "Private task"
    assert private_task.status.value == "not_started"


def test_task_cannot_be_created_or_moved_into_another_users_subject(
    client: TestClient,
    db_session: Session,
) -> None:
    owner = create_user(db_session, "target-owner@example.com")
    attacker = create_user(db_session, "target-attacker@example.com")
    private_subject = create_subject(db_session, owner, "Owner-only subject")
    attacker_subject = create_subject(db_session, attacker, "Attacker subject")
    attacker_task = create_task(db_session, attacker_subject, "Attacker task")
    headers = auth_headers(attacker)

    create_response = client.post(
        "/api/v1/tasks",
        headers=headers,
        json={"title": "Injected task", "subject_id": private_subject.id},
    )
    move_response = client.put(
        f"/api/v1/tasks/{attacker_task.id}",
        headers=headers,
        json={"subject_id": private_subject.id},
    )

    assert create_response.status_code == 404
    assert move_response.status_code == 404
    db_session.refresh(attacker_task)
    assert attacker_task.subject_id == attacker_subject.id
