from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.subject import Subject
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


def auth_headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def test_subject_crud_lifecycle(client: TestClient, db_session: Session) -> None:
    user = create_user(db_session, "subject-crud@example.com")
    headers = auth_headers(user)
    payload = {
        "name": "Application Security",
        "color": "#c45d4b",
        "teacher": "Dr. Rivera",
        "semester": "Spring 2026",
        "description": "Security labs and coursework",
    }

    create_response = client.post("/api/v1/subjects", headers=headers, json=payload)

    assert create_response.status_code == 201
    created_subject = create_response.json()
    subject_id = created_subject["id"]
    assert created_subject["user_id"] == user.id
    for field, value in payload.items():
        assert created_subject[field] == value

    list_response = client.get("/api/v1/subjects", headers=headers)
    get_response = client.get(f"/api/v1/subjects/{subject_id}", headers=headers)

    assert list_response.status_code == 200
    assert [subject["id"] for subject in list_response.json()] == [subject_id]
    assert get_response.status_code == 200
    assert get_response.json()["name"] == payload["name"]

    update_response = client.put(
        f"/api/v1/subjects/{subject_id}",
        headers=headers,
        json={"name": "Advanced Application Security", "teacher": "Prof. Chen"},
    )

    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Advanced Application Security"
    assert update_response.json()["teacher"] == "Prof. Chen"
    assert update_response.json()["color"] == payload["color"]

    delete_response = client.delete(f"/api/v1/subjects/{subject_id}", headers=headers)

    assert delete_response.status_code == 204
    assert client.get(f"/api/v1/subjects/{subject_id}", headers=headers).status_code == 404
    assert client.get("/api/v1/subjects", headers=headers).json() == []


def test_task_crud_lifecycle(client: TestClient, db_session: Session) -> None:
    user = create_user(db_session, "task-crud@example.com")
    subject = create_subject(db_session, user, "Network Security")
    headers = auth_headers(user)
    payload = {
        "title": "Packet analysis report",
        "description": "Inspect the capture and document suspicious traffic.",
        "deadline": "2026-07-05T18:00:00Z",
        "subject_id": subject.id,
        "type": "lab",
        "priority": "high",
        "status": "not_started",
        "github_url": "https://github.com/example/packet-report",
        "estimated_hours": 4,
    }

    create_response = client.post("/api/v1/tasks", headers=headers, json=payload)

    assert create_response.status_code == 201
    task_id = create_response.json()["id"]
    assert create_response.json()["title"] == payload["title"]
    assert create_response.json()["priority"] == payload["priority"]

    list_response = client.get("/api/v1/tasks", headers=headers)
    get_response = client.get(f"/api/v1/tasks/{task_id}", headers=headers)

    assert list_response.status_code == 200
    assert [task["id"] for task in list_response.json()] == [task_id]
    assert get_response.status_code == 200
    assert get_response.json()["description"] == payload["description"]

    update_response = client.put(
        f"/api/v1/tasks/{task_id}",
        headers=headers,
        json={
            "title": "Packet analysis final report",
            "priority": "critical",
            "estimated_hours": 6,
        },
    )
    status_response = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        headers=headers,
        json={"status": "accepted"},
    )

    assert update_response.status_code == 200
    assert update_response.json()["title"] == "Packet analysis final report"
    assert update_response.json()["priority"] == "critical"
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "accepted"
    assert status_response.json()["submitted_at"] is not None
    assert status_response.json()["accepted_at"] is not None

    delete_response = client.delete(f"/api/v1/tasks/{task_id}", headers=headers)

    assert delete_response.status_code == 204
    assert client.get(f"/api/v1/tasks/{task_id}", headers=headers).status_code == 404
    assert client.get("/api/v1/tasks", headers=headers).json() == []


def test_task_list_supports_active_and_deadline_filters(
    client: TestClient,
    db_session: Session,
) -> None:
    user = create_user(db_session, "task-filters@example.com")
    subject = create_subject(db_session, user, "Filter Subject")
    headers = auth_headers(user)
    now = datetime.now(timezone.utc)

    task_payloads = [
        {
            "title": "Overdue active",
            "subject_id": subject.id,
            "status": "in_progress",
            "deadline": (now - timedelta(days=2)).isoformat(),
        },
        {
            "title": "Overdue completed",
            "subject_id": subject.id,
            "status": "accepted",
            "deadline": (now - timedelta(days=2)).isoformat(),
        },
        {
            "title": "Due today",
            "subject_id": subject.id,
            "deadline": now.isoformat(),
        },
        {
            "title": "Future active",
            "subject_id": subject.id,
            "deadline": (now + timedelta(days=10)).isoformat(),
        },
    ]
    for payload in task_payloads:
        assert client.post("/api/v1/tasks", headers=headers, json=payload).status_code == 201

    overdue_response = client.get(
        "/api/v1/tasks",
        headers=headers,
        params={
            "active_only": "true",
            "deadline_before": (now.date() - timedelta(days=1)).isoformat(),
        },
    )
    today_response = client.get(
        "/api/v1/tasks",
        headers=headers,
        params={
            "active_only": "true",
            "deadline_after": now.date().isoformat(),
            "deadline_before": now.date().isoformat(),
        },
    )
    completed_response = client.get(
        "/api/v1/tasks",
        headers=headers,
        params={"status": "accepted"},
    )
    active_response = client.get(
        "/api/v1/tasks",
        headers=headers,
        params={"active_only": "true"},
    )

    assert overdue_response.status_code == 200
    assert [task["title"] for task in overdue_response.json()] == ["Overdue active"]
    assert today_response.status_code == 200
    assert [task["title"] for task in today_response.json()] == ["Due today"]
    assert completed_response.status_code == 200
    assert [task["title"] for task in completed_response.json()] == ["Overdue completed"]
    assert active_response.status_code == 200
    assert {task["title"] for task in active_response.json()} == {
        "Overdue active",
        "Due today",
        "Future active",
    }
