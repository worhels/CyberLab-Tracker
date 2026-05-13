from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subject import Subject
from app.models.task import Task, TaskStatus
from app.schemas.task import TaskCreate, TaskStatusUpdate, TaskUpdate


def list_tasks(
    db: Session,
    user_id: int,
    status: TaskStatus | None = None,
    subject_id: int | None = None,
) -> list[Task]:
    statement = select(Task).join(Subject).where(Subject.user_id == user_id)

    if status is not None:
        statement = statement.where(Task.status == status)

    if subject_id is not None:
        statement = statement.where(Task.subject_id == subject_id)

    statement = statement.order_by(Task.deadline.is_(None), Task.deadline, Task.created_at.desc())
    return list(db.scalars(statement))


def get_task(db: Session, task_id: int, user_id: int) -> Task | None:
    return db.scalar(select(Task).join(Subject).where(Task.id == task_id, Subject.user_id == user_id))


def create_task(db: Session, payload: TaskCreate) -> Task:
    task = Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, task: Task, payload: TaskUpdate) -> Task:
    values = payload.model_dump(exclude_unset=True)

    for key, value in values.items():
        setattr(task, key, value)

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task_status(db: Session, task: Task, payload: TaskStatusUpdate) -> Task:
    task.status = payload.status
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()
