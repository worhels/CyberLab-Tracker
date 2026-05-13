from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subject import Subject
from app.models.task import Task, TaskPriority, TaskStatus, TaskType
from app.schemas.task import TaskCreate, TaskStatusUpdate, TaskUpdate


def apply_status_timestamps(task: Task) -> None:
    now = datetime.now(timezone.utc)
    if task.status == TaskStatus.SUBMITTED and task.submitted_at is None:
        task.submitted_at = now
    elif task.status == TaskStatus.ACCEPTED:
        if task.submitted_at is None:
            task.submitted_at = now
        if task.accepted_at is None:
            task.accepted_at = now


def list_tasks(
    db: Session,
    user_id: int,
    status: TaskStatus | None = None,
    subject_id: int | None = None,
    priority: TaskPriority | None = None,
    task_type: TaskType | None = None,
    deadline_before: datetime | None = None,
    deadline_after: datetime | None = None,
    search: str | None = None,
) -> list[Task]:
    statement = select(Task).join(Subject).where(Subject.user_id == user_id)

    if status is not None:
        statement = statement.where(Task.status == status)

    if subject_id is not None:
        statement = statement.where(Task.subject_id == subject_id)

    if priority is not None:
        statement = statement.where(Task.priority == priority)

    if task_type is not None:
        statement = statement.where(Task.type == task_type)

    if deadline_before is not None:
        statement = statement.where(Task.deadline.is_not(None), Task.deadline <= deadline_before)

    if deadline_after is not None:
        statement = statement.where(Task.deadline.is_not(None), Task.deadline >= deadline_after)

    if search:
        like_pattern = f"%{search.strip()}%"
        statement = statement.where(
            Task.title.ilike(like_pattern) | Task.description.ilike(like_pattern)
        )

    statement = statement.order_by(Task.deadline.is_(None), Task.deadline, Task.created_at.desc())
    return list(db.scalars(statement))


def get_task(db: Session, task_id: int, user_id: int) -> Task | None:
    return db.scalar(select(Task).join(Subject).where(Task.id == task_id, Subject.user_id == user_id))


def create_task(db: Session, payload: TaskCreate) -> Task:
    task = Task(**payload.model_dump())
    apply_status_timestamps(task)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, task: Task, payload: TaskUpdate) -> Task:
    values = payload.model_dump(exclude_unset=True)

    for key, value in values.items():
        setattr(task, key, value)

    if "status" in values:
        apply_status_timestamps(task)

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task_status(db: Session, task: Task, payload: TaskStatusUpdate) -> Task:
    task.status = payload.status
    apply_status_timestamps(task)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()
