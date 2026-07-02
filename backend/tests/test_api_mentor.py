import asyncio
from collections.abc import AsyncIterator
from datetime import datetime, timezone

import httpx
import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from pytest import MonkeyPatch
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.endpoints import mentor as mentor_endpoint
from app.core.security import create_access_token
from app.crud import crud_mentor
from app.crud.mentor_context import build_workspace_context
from app.models.mentor import MentorMessage
from app.models.subject import Subject
from app.models.task import Task, TaskStatus, TaskType
from app.models.user import User


def create_user(db: Session, email: str) -> User:
    user = User(email=email, hashed_password="unused-test-hash")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def create_subject_and_task(db: Session, user: User) -> tuple[Subject, Task]:
    subject = Subject(
        name="Кібербезпека",
        teacher="Олена Коваль",
        semester="2026",
        description="Практична безпека сервісів",
        user_id=user.id,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    task = Task(
        title="Лабораторна робота №3",
        description="Запустити проєкт через Docker Compose",
        deadline=datetime(2026, 7, 3, 18, tzinfo=timezone.utc),
        status=TaskStatus.NOT_STARTED,
        subject_id=subject.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return subject, task


def test_mentor_chat_builds_multilingual_context_and_saves_history(
    client: TestClient,
    db_session: Session,
    monkeypatch: MonkeyPatch,
) -> None:
    user = create_user(db_session, "mentor@example.com")
    subject, task = create_subject_and_task(db_session, user)
    ollama_calls: list[
        tuple[
            list[mentor_endpoint.OllamaMessagePayload],
            mentor_endpoint.AnswerProfile,
        ]
    ] = []

    def fake_chat(
        messages: list[mentor_endpoint.OllamaMessagePayload],
        answer_profile: mentor_endpoint.AnswerProfile,
    ) -> str:
        ollama_calls.append((messages, answer_profile))
        return "Зроби так: перевір Docker і запусти compose."

    monkeypatch.setattr(mentor_endpoint, "chat_with_ollama", fake_chat)
    payload = {
        "message": "Що робити з цією лабою?",
        "mode": "chat",
        "page": "/tasks",
        "subject_id": subject.id,
        "task_id": task.id,
        "session_id": f"task-{task.id}",
        "language": "auto",
    }

    response = client.post("/api/v1/mentor/chat", headers=auth_headers(user), json=payload)

    assert response.status_code == 200
    assert response.json() == {
        "answer": "Зроби так: перевір Docker і запусти compose.",
        "session_id": f"task-{task.id}",
    }
    messages, answer_profile = ollama_calls[0]
    assert answer_profile["format"] == "lab"
    system_prompt = messages[0]["content"]
    assert '"name":"Кібербезпека"' in system_prompt
    assert '"title":"Лабораторна робота №3"' in system_prompt
    assert '"description":"Запустити проєкт через Docker Compose"' in system_prompt
    assert '"intent":"current_task_help"' in system_prompt
    assert '"language":"uk"' in system_prompt
    assert messages[-1] == {"role": "user", "content": payload["message"]}

    stored_messages = list(
        db_session.scalars(select(MentorMessage).order_by(MentorMessage.created_at, MentorMessage.id))
    )
    assert [message.role for message in stored_messages] == ["user", "assistant"]
    assert all(message.user_id == user.id for message in stored_messages)
    assert all(message.subject_id == subject.id for message in stored_messages)
    assert all(message.task_id == task.id for message in stored_messages)

    follow_up = client.post(
        "/api/v1/mentor/chat",
        headers=auth_headers(user),
        json={
            "message": "А далі?",
            "mode": "chat",
            "page": "/tasks",
            "session_id": f"task-{task.id}",
            "language": "auto",
        },
    )

    assert follow_up.status_code == 200
    assert ollama_calls[1][0][1:] == [
        {"role": "user", "content": "Що робити з цією лабою?"},
        {
            "role": "assistant",
            "content": "Зроби так: перевір Docker і запусти compose.",
        },
        {"role": "user", "content": "А далі?"},
    ]


def test_dashboard_context_uses_current_user_workspace_data(
    client: TestClient,
    db_session: Session,
    monkeypatch: MonkeyPatch,
) -> None:
    user = create_user(db_session, "workspace-context@example.com")
    other_user = create_user(db_session, "private-workspace@example.com")
    subject = Subject(name="Network Security", user_id=user.id)
    private_subject = Subject(name="Private Subject", user_id=other_user.id)
    db_session.add_all([subject, private_subject])
    db_session.commit()
    db_session.refresh(subject)
    db_session.refresh(private_subject)
    db_session.add_all(
        [
            Task(
                title="Accepted firewall lab",
                status=TaskStatus.ACCEPTED,
                subject_id=subject.id,
            ),
            Task(
                title="Open packet analysis",
                deadline=datetime(2026, 7, 10, 18, tzinfo=timezone.utc),
                status=TaskStatus.IN_PROGRESS,
                subject_id=subject.id,
            ),
            Task(
                title="Foreign private task",
                status=TaskStatus.NOT_STARTED,
                subject_id=private_subject.id,
            ),
        ]
    )
    db_session.commit()
    captured_prompt = ""

    def fake_chat(
        messages: list[mentor_endpoint.OllamaMessagePayload],
        answer_profile: mentor_endpoint.AnswerProfile,
    ) -> str:
        nonlocal captured_prompt
        captured_prompt = messages[0]["content"]
        assert answer_profile["format"] == "direct_list"
        return "У предметов нет статуса закрытия; принята 1 задача из 2."

    monkeypatch.setattr(mentor_endpoint, "chat_with_ollama", fake_chat)

    response = client.post(
        "/api/v1/mentor/chat",
        headers=auth_headers(user),
        json={
            "message": "Что у нас по закрытым предметам?",
            "mode": "chat",
            "page": "/dashboard",
            "language": "auto",
        },
    )

    assert response.status_code == 200
    assert '"intent":"task_status"' in captured_prompt
    assert '"counts":{"active":1,"review":0,"done":1}' in captured_prompt
    assert '"subjects_have_status":false' in captured_prompt
    assert '"title":"Accepted firewall lab"' in captured_prompt
    assert '"title":"Open packet analysis"' in captured_prompt
    assert "Private Subject" not in captured_prompt
    assert "Foreign private task" not in captured_prompt
    assert "/closed-subjects" not in captured_prompt


def test_active_labs_intent_uses_owned_backend_context_and_overrides_chat_mode(
    client: TestClient,
    db_session: Session,
    monkeypatch: MonkeyPatch,
) -> None:
    user = create_user(db_session, "active-labs@example.com")
    other_user = create_user(db_session, "foreign-labs@example.com")
    subject = Subject(name="Applied Security", user_id=user.id)
    foreign_subject = Subject(name="Foreign Security", user_id=other_user.id)
    db_session.add_all([subject, foreign_subject])
    db_session.commit()
    db_session.refresh(subject)
    db_session.refresh(foreign_subject)
    db_session.add_all(
        [
            Task(
                title="Active owned lab",
                type=TaskType.LAB,
                status=TaskStatus.NOT_STARTED,
                subject_id=subject.id,
            ),
            Task(
                title="Accepted owned lab",
                type=TaskType.LAB,
                status=TaskStatus.ACCEPTED,
                subject_id=subject.id,
            ),
            Task(
                title="Submitted owned lab",
                type=TaskType.LAB,
                status=TaskStatus.SUBMITTED,
                subject_id=subject.id,
            ),
            Task(
                title="Active practice",
                type=TaskType.PRACTICE,
                status=TaskStatus.IN_PROGRESS,
                subject_id=subject.id,
            ),
            Task(
                title="Foreign active lab",
                type=TaskType.LAB,
                status=TaskStatus.NOT_STARTED,
                subject_id=foreign_subject.id,
            ),
        ]
    )
    db_session.commit()

    active_labs_calls: list[int] = []
    original_get_active_labs = crud_mentor.get_active_labs_for_user

    def tracked_get_active_labs(db: Session, user_id: int) -> list[Task]:
        active_labs_calls.append(user_id)
        return original_get_active_labs(db, user_id)

    captured_prompt = ""

    def fake_chat(
        messages: list[mentor_endpoint.OllamaMessagePayload],
        answer_profile: mentor_endpoint.AnswerProfile,
    ) -> str:
        nonlocal captured_prompt
        captured_prompt = messages[0]["content"]
        assert answer_profile == {
            "num_predict": 512,
            "temperature": 0.2,
            "format": "direct_list",
        }
        return "Активная лабораторная: Active owned lab."

    monkeypatch.setattr(
        mentor_endpoint.crud_mentor,
        "get_active_labs_for_user",
        tracked_get_active_labs,
    )
    monkeypatch.setattr(mentor_endpoint, "chat_with_ollama", fake_chat)

    response = client.post(
        "/api/v1/mentor/chat",
        headers=auth_headers(user),
        json={
            "message": "Какие активные лабы?",
            "mode": "chat",
            "page": "/dashboard",
            "language": "en",
        },
    )

    assert response.status_code == 200
    assert response.json()["answer"] == (
        "Активные лабораторные:\n"
        "1. Active owned lab — Applied Security (not_started)\n\n"
        "Уже приняты и не активны:\n"
        "1. Accepted owned lab — Applied Security"
    )
    assert active_labs_calls == [user.id]
    assert '"intent":"active_labs"' in captured_prompt
    assert '"selected_mode":"chat"' in captured_prompt
    assert '"language":"ru"' in captured_prompt
    assert '"active_labs_count":1,"accepted_labs_count":1' in captured_prompt
    assert "Active owned lab" in captured_prompt
    assert "Accepted owned lab" in captured_prompt
    assert "Submitted owned lab" not in captured_prompt
    assert "Active practice" not in captured_prompt
    assert "Foreign active lab" not in captured_prompt

    stream_response = client.post(
        "/api/v1/mentor/chat/stream",
        headers=auth_headers(user),
        json={
            "message": "Покажи активные лабы",
            "mode": "chat",
            "page": "/dashboard",
        },
    )

    assert stream_response.status_code == 200
    assert "Уже приняты и не активны:" in stream_response.text
    assert "Accepted owned lab" in stream_response.text
    assert "event: done" in stream_response.text
    assert active_labs_calls == [user.id, user.id]


@pytest.mark.parametrize(
    ("message", "expected_intent", "expected_format"),
    [
        ("Почему код падает?", "code_debug", "code_debug"),
        ("Напиши отчёт к работе", "write_report", "report"),
        ("Напиши вывод к лабе", "write_conclusion", "report"),
    ],
)
def test_message_intent_overrides_chat_answer_profile(
    message: str,
    expected_intent: mentor_endpoint.MentorIntent,
    expected_format: str,
) -> None:
    intent = mentor_endpoint.detect_mentor_intent(message)
    profile = mentor_endpoint.resolve_answer_profile(
        intent,
        mentor_endpoint.MentorMode.CHAT,
    )

    assert intent == expected_intent
    assert profile["format"] == expected_format


@pytest.mark.parametrize(
    ("message", "expected_intent"),
    [
        ("Покажи активные лабы", "active_labs"),
        ("Что сейчас горит?", "active_tasks"),
        ("Покажи ближайшие дедлайны", "deadlines"),
        ("Что уже принято?", "task_status"),
    ],
)
def test_chat_quick_prompts_resolve_to_data_intents(
    message: str,
    expected_intent: mentor_endpoint.MentorIntent,
) -> None:
    assert mentor_endpoint.detect_mentor_intent(message) == expected_intent


def test_workspace_context_lists_are_bounded(
    db_session: Session,
) -> None:
    user = create_user(db_session, "bounded-context@example.com")
    subjects = [
        Subject(name=f"Subject {index:02d}", user_id=user.id)
        for index in range(25)
    ]
    db_session.add_all(subjects)
    db_session.commit()
    for subject in subjects:
        db_session.refresh(subject)
        db_session.add(
            Task(
                title=f"Accepted task {subject.id}",
                status=TaskStatus.ACCEPTED,
                subject_id=subject.id,
            )
        )
    db_session.commit()

    context = build_workspace_context(
        db_session,
        user_id=user.id,
        page="/dashboard",
        selected_subject=None,
        selected_task=None,
    )

    assert context["workspace_summary"] == {
        "total_subjects": 25,
        "total_tasks": 25,
        "accepted_tasks": 25,
        "active_tasks": 0,
        "in_progress_tasks": 0,
        "debt_tasks": 0,
        "overdue_tasks": 0,
        "progress_percent": 100.0,
        "nearest_deadline": None,
        "task_status_counts": {
            "not_started": 0,
            "in_progress": 0,
            "submitted": 0,
            "accepted": 25,
            "debt": 0,
        },
    }
    assert len(context["subjects"]) == 20
    assert len(context["tasks"]) == 10
    assert context["context_limits"] == {
        "subjects_included": 20,
        "subjects_total": 25,
        "tasks_included": 10,
        "tasks_total": 25,
    }


@pytest.mark.parametrize(
    "message",
    [
        "Привет, отвечай коротко",
        "Привіт, відповідай коротко",
        "Explain this error briefly",
    ],
)
def test_mentor_chat_accepts_supported_user_languages(
    message: str,
    client: TestClient,
    db_session: Session,
    monkeypatch: MonkeyPatch,
) -> None:
    user = create_user(db_session, f"language-{abs(hash(message))}@example.com")

    def fake_chat(
        messages: list[mentor_endpoint.OllamaMessagePayload],
        answer_profile: mentor_endpoint.AnswerProfile,
    ) -> str:
        assert messages[-1]["content"] == message
        assert answer_profile["format"] in {"chat", "code_debug"}
        return "ok"

    monkeypatch.setattr(mentor_endpoint, "chat_with_ollama", fake_chat)
    response = client.post(
        "/api/v1/mentor/chat",
        headers=auth_headers(user),
        json={
            "message": message,
            "mode": "chat",
            "page": "/dashboard",
            "language": "auto",
        },
    )

    assert response.status_code == 200


def test_mentor_chat_rejects_invalid_mode(
    client: TestClient,
    db_session: Session,
) -> None:
    user = create_user(db_session, "invalid-mode@example.com")

    response = client.post(
        "/api/v1/mentor/chat",
        headers=auth_headers(user),
        json={
            "message": "Hello",
            "mode": "unsupported",
            "page": "/dashboard",
        },
    )

    assert response.status_code == 422


@pytest.mark.parametrize("context_kind", ["subject", "task"])
def test_mentor_chat_rejects_context_owned_by_another_user(
    context_kind: str,
    client: TestClient,
    db_session: Session,
    monkeypatch: MonkeyPatch,
) -> None:
    user = create_user(db_session, f"student-{context_kind}@example.com")
    other_user = create_user(db_session, f"other-{context_kind}@example.com")
    other_subject, other_task = create_subject_and_task(db_session, other_user)

    def unexpected_chat(
        messages: list[mentor_endpoint.OllamaMessagePayload],
        answer_profile: mentor_endpoint.AnswerProfile,
    ) -> str:
        raise AssertionError(
            f"Ollama must not be called for foreign context: {messages}, {answer_profile}"
        )

    monkeypatch.setattr(mentor_endpoint, "chat_with_ollama", unexpected_chat)
    context = (
        {"subject_id": other_subject.id}
        if context_kind == "subject"
        else {"task_id": other_task.id}
    )

    response = client.post(
        "/api/v1/mentor/chat",
        headers=auth_headers(user),
        json={
            "message": "Show this context",
            "mode": "lab",
            "page": "/tasks",
            **context,
        },
    )

    assert response.status_code == 404


def test_ollama_chat_uses_mode_settings_and_keep_alive(monkeypatch: MonkeyPatch) -> None:
    captured: dict[str, object] = {}

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {"message": {"role": "assistant", "content": "Ready"}}

    def fake_post(
        url: str,
        *,
        json: dict[str, object],
        timeout: float,
    ) -> FakeResponse:
        captured.update({"url": url, "json": json, "timeout": timeout})
        return FakeResponse()

    monkeypatch.setattr(mentor_endpoint.httpx, "post", fake_post)

    answer = mentor_endpoint.chat_with_ollama(
        [{"role": "user", "content": "Explain this error"}],
        mentor_endpoint.resolve_answer_profile(
            "code_debug",
            mentor_endpoint.MentorMode.CHAT,
        ),
    )

    assert answer == "Ready"
    assert captured["url"] == "http://localhost:11434/api/chat"
    assert captured["timeout"] == 120.0
    request_json = captured["json"]
    assert isinstance(request_json, dict)
    assert request_json["model"] == "qwen2.5-coder:7b"
    assert request_json["stream"] is False
    assert request_json["keep_alive"] == "30m"
    assert request_json["options"] == {
        "num_ctx": 8192,
        "top_p": 0.9,
        "num_predict": 768,
        "temperature": 0.2,
    }


@pytest.mark.parametrize(
    ("mode", "num_predict", "temperature"),
    [
        (mentor_endpoint.MentorMode.CHAT, 512, 0.4),
        (mentor_endpoint.MentorMode.DEADLINE, 512, 0.25),
        (mentor_endpoint.MentorMode.CODE, 768, 0.2),
        (mentor_endpoint.MentorMode.LAB, 768, 0.3),
        (mentor_endpoint.MentorMode.REPORT, 1_024, 0.3),
    ],
)
def test_ollama_stream_payload_uses_mode_generation_limits(
    mode: mentor_endpoint.MentorMode,
    num_predict: int,
    temperature: float,
) -> None:
    payload = mentor_endpoint.build_ollama_payload(
        [{"role": "user", "content": "Hello"}],
        answer_profile=mentor_endpoint.resolve_answer_profile("casual_chat", mode),
        stream=True,
    )

    assert payload["stream"] is True
    assert payload["keep_alive"] == "30m"
    options = payload["options"]
    assert isinstance(options, dict)
    assert options["num_predict"] == num_predict
    assert options["temperature"] == temperature


def test_ollama_offline_returns_503(monkeypatch: MonkeyPatch) -> None:
    request = httpx.Request("POST", mentor_endpoint.OLLAMA_CHAT_URL)

    def offline_post(*args: object, **kwargs: object) -> None:
        raise httpx.ConnectError("offline", request=request)

    monkeypatch.setattr(mentor_endpoint.httpx, "post", offline_post)

    with pytest.raises(HTTPException) as exc_info:
        mentor_endpoint.chat_with_ollama(
            [{"role": "user", "content": "Hello"}],
            mentor_endpoint.resolve_answer_profile(
                "casual_chat",
                mentor_endpoint.MentorMode.CHAT,
            ),
        )

    assert exc_info.value.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert exc_info.value.detail == mentor_endpoint.OFFLINE_ERROR_MESSAGE


def test_mentor_stream_returns_chunks_and_saves_exchange(
    client: TestClient,
    db_session: Session,
    monkeypatch: MonkeyPatch,
) -> None:
    user = create_user(db_session, "stream@example.com")
    subject, task = create_subject_and_task(db_session, user)

    async def fake_stream(
        messages: list[mentor_endpoint.OllamaMessagePayload],
        answer_profile: mentor_endpoint.AnswerProfile,
    ) -> AsyncIterator[str]:
        assert messages[-1]["content"] == "Покажи план"
        assert answer_profile["format"] == "deadline"
        yield "Крок 1. "
        yield "Запусти тести."

    monkeypatch.setattr(mentor_endpoint, "stream_with_ollama", fake_stream)

    response = client.post(
        "/api/v1/mentor/chat/stream",
        headers=auth_headers(user),
        json={
            "message": "Покажи план",
            "mode": "deadline",
            "page": "/tasks",
            "subject_id": subject.id,
            "task_id": task.id,
            "language": "auto",
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert 'event: token\ndata: {"token":"Крок 1. "}' in response.text
    assert 'event: token\ndata: {"token":"Запусти тести."}' in response.text
    assert f'event: done\ndata: {{"session_id":"task-{task.id}"}}' in response.text
    stored_messages = list(
        db_session.scalars(select(MentorMessage).order_by(MentorMessage.created_at, MentorMessage.id))
    )
    assert [message.content for message in stored_messages] == [
        "Покажи план",
        "Крок 1. Запусти тести.",
    ]


def test_mentor_stream_offline_returns_503_before_stream_starts(
    client: TestClient,
    db_session: Session,
    monkeypatch: MonkeyPatch,
) -> None:
    user = create_user(db_session, "stream-offline@example.com")

    async def offline_stream(
        messages: list[mentor_endpoint.OllamaMessagePayload],
        answer_profile: mentor_endpoint.AnswerProfile,
    ) -> AsyncIterator[str]:
        if False:
            yield ""
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=mentor_endpoint.OFFLINE_ERROR_MESSAGE,
        )

    monkeypatch.setattr(mentor_endpoint, "stream_with_ollama", offline_stream)

    response = client.post(
        "/api/v1/mentor/chat/stream",
        headers=auth_headers(user),
        json={
            "message": "Hello",
            "mode": "chat",
            "page": "/dashboard",
        },
    )

    assert response.status_code == 503
    assert response.json()["detail"] == mentor_endpoint.OFFLINE_ERROR_MESSAGE
    assert list(db_session.scalars(select(MentorMessage))) == []


def test_warmup_failure_does_not_raise(
    monkeypatch: MonkeyPatch,
) -> None:
    request = httpx.Request("POST", mentor_endpoint.OLLAMA_CHAT_URL)

    class OfflineAsyncClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == mentor_endpoint.OLLAMA_TIMEOUT_SECONDS

        async def __aenter__(self) -> "OfflineAsyncClient":
            return self

        async def __aexit__(self, *args: object) -> None:
            return None

        async def post(self, url: str, *, json: dict[str, object]) -> None:
            raise httpx.ConnectError("offline", request=request)

    monkeypatch.setattr(mentor_endpoint.settings, "OLLAMA_WARMUP_ENABLED", True)
    monkeypatch.setattr(mentor_endpoint.httpx, "AsyncClient", OfflineAsyncClient)

    asyncio.run(mentor_endpoint.warmup_ollama())
