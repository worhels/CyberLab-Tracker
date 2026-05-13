from datetime import date, datetime, time, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud import subjects as subject_crud
from app.crud import tasks as task_crud
from app.db.session import get_db
from app.models.task import TaskPriority, TaskStatus, TaskType
from app.models.user import User
from app.schemas.task import TaskCreate, TaskRead, TaskStatusUpdate, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


def ensure_subject_exists(db: Session, subject_id: int, user_id: int) -> None:
    if subject_crud.get_subject(db, subject_id, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")


@router.get("", response_model=list[TaskRead])
def list_tasks(
    status_filter: Annotated[TaskStatus | None, Query(alias="status")] = None,
    subject_id: int | None = None,
    priority: TaskPriority | None = None,
    task_type: Annotated[TaskType | None, Query(alias="type")] = None,
    deadline_before: date | None = None,
    deadline_after: date | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deadline_before_dt = (
        datetime.combine(deadline_before, time.max, tzinfo=timezone.utc) if deadline_before else None
    )
    deadline_after_dt = (
        datetime.combine(deadline_after, time.min, tzinfo=timezone.utc) if deadline_after else None
    )

    return task_crud.list_tasks(
        db,
        current_user.id,
        status=status_filter,
        subject_id=subject_id,
        priority=priority,
        task_type=task_type,
        deadline_before=deadline_before_dt,
        deadline_after=deadline_after_dt,
        search=search,
    )


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_subject_exists(db, payload.subject_id, current_user.id)
    return task_crud.create_task(db, payload)


@router.get("/{task_id}", response_model=TaskRead)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_crud.get_task(db, task_id, current_user.id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_crud.get_task(db, task_id, current_user.id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if payload.subject_id is not None:
        ensure_subject_exists(db, payload.subject_id, current_user.id)
    return task_crud.update_task(db, task, payload)


@router.patch("/{task_id}/status", response_model=TaskRead)
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_crud.get_task(db, task_id, current_user.id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    return task_crud.update_task_status(db, task, payload)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    task = task_crud.get_task(db, task_id, current_user.id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task_crud.delete_task(db, task)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
