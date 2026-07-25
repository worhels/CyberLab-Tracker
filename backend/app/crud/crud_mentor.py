from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.mentor import MentorMessage
from app.models.subject import Subject
from app.models.task import Task, TaskStatus, TaskType

ACTIVE_TASK_STATUSES = frozenset(
    {
        TaskStatus.NOT_STARTED,
        TaskStatus.IN_PROGRESS,
        TaskStatus.DEBT,
    }
)
REVIEW_TASK_STATUSES = frozenset({TaskStatus.SUBMITTED})
DONE_TASK_STATUSES = frozenset({TaskStatus.ACCEPTED})
MENTOR_TASK_LIST_LIMIT = 20


def _owned_tasks_statement(user_id: int):
    return (
        select(Task)
        .join(Subject, Task.subject_id == Subject.id)
        .where(Subject.user_id == user_id)
        .options(selectinload(Task.subject))
    )


def get_active_labs_for_user(db: Session, user_id: int) -> list[Task]:
    statement = (
        _owned_tasks_statement(user_id)
        .where(
            Task.type == TaskType.LAB,
            Task.status.in_(ACTIVE_TASK_STATUSES),
        )
        .order_by(Task.deadline.is_(None), Task.deadline.asc(), Task.id.asc())
        .limit(MENTOR_TASK_LIST_LIMIT)
    )
    return list(db.scalars(statement))


def get_accepted_labs_for_user(db: Session, user_id: int) -> list[Task]:
    statement = (
        _owned_tasks_statement(user_id)
        .where(
            Task.type == TaskType.LAB,
            Task.status.in_(DONE_TASK_STATUSES),
        )
        .order_by(Task.updated_at.desc(), Task.id.desc())
        .limit(MENTOR_TASK_LIST_LIMIT)
    )
    return list(db.scalars(statement))


def get_active_tasks_for_user(db: Session, user_id: int) -> list[Task]:
    statement = (
        _owned_tasks_statement(user_id)
        .where(Task.status.in_(ACTIVE_TASK_STATUSES))
        .order_by(Task.deadline.is_(None), Task.deadline.asc(), Task.id.asc())
        .limit(MENTOR_TASK_LIST_LIMIT)
    )
    return list(db.scalars(statement))


def get_review_tasks_for_user(db: Session, user_id: int) -> list[Task]:
    statement = (
        _owned_tasks_statement(user_id)
        .where(Task.status.in_(REVIEW_TASK_STATUSES))
        .order_by(Task.updated_at.desc(), Task.id.desc())
        .limit(MENTOR_TASK_LIST_LIMIT)
    )
    return list(db.scalars(statement))


def get_accepted_tasks_for_user(db: Session, user_id: int) -> list[Task]:
    statement = (
        _owned_tasks_statement(user_id)
        .where(Task.status.in_(DONE_TASK_STATUSES))
        .order_by(Task.updated_at.desc(), Task.id.desc())
        .limit(MENTOR_TASK_LIST_LIMIT)
    )
    return list(db.scalars(statement))


def get_deadline_overview_for_user(db: Session, user_id: int) -> list[Task]:
    statement = (
        _owned_tasks_statement(user_id)
        .where(
            Task.status.in_(ACTIVE_TASK_STATUSES),
            Task.deadline.is_not(None),
        )
        .order_by(Task.deadline.asc(), Task.id.asc())
        .limit(MENTOR_TASK_LIST_LIMIT)
    )
    return list(db.scalars(statement))


def get_current_task_context(
    db: Session,
    user_id: int,
    task_id: int,
) -> Task | None:
    statement = _owned_tasks_statement(user_id).where(Task.id == task_id)
    return db.scalar(statement)


def get_current_subject_context(
    db: Session,
    user_id: int,
    subject_id: int,
) -> Subject | None:
    statement = select(Subject).where(
        Subject.id == subject_id,
        Subject.user_id == user_id,
    )
    return db.scalar(statement)


def create_message(
    db: Session,
    *,
    user_id: int,
    session_id: str,
    role: str,
    content: str,
    page: str | None,
    subject_id: int | None,
    task_id: int | None,
) -> MentorMessage:
    message = MentorMessage(
        user_id=user_id,
        session_id=session_id,
        role=role,
        content=content,
        page=page,
        subject_id=subject_id,
        task_id=task_id,
    )
    db.add(message)
    return message


def save_exchange(
    db: Session,
    *,
    user_id: int,
    session_id: str,
    user_content: str,
    assistant_content: str,
    page: str | None,
    subject_id: int | None,
    task_id: int | None,
) -> None:
    create_message(
        db,
        user_id=user_id,
        session_id=session_id,
        role="user",
        content=user_content,
        page=page,
        subject_id=subject_id,
        task_id=task_id,
    )
    create_message(
        db,
        user_id=user_id,
        session_id=session_id,
        role="assistant",
        content=assistant_content,
        page=page,
        subject_id=subject_id,
        task_id=task_id,
    )
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise


def list_session_messages(
    db: Session,
    *,
    user_id: int,
    session_id: str,
    limit: int = 20,
) -> list[MentorMessage]:
    safe_limit = min(max(limit, 1), 100)
    statement = (
        select(MentorMessage)
        .where(
            MentorMessage.user_id == user_id,
            MentorMessage.session_id == session_id,
        )
        .order_by(MentorMessage.created_at.desc(), MentorMessage.id.desc())
        .limit(safe_limit)
    )
    return list(reversed(list(db.scalars(statement))))
