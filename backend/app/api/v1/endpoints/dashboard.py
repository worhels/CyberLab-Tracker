from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.subject import Subject
from app.models.task import Task, TaskPriority, TaskStatus, TaskType
from app.models.user import User
from app.schemas.dashboard import CrisisTask, DashboardSummary
from app.schemas.task import TaskRead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def normalize_dt(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def user_tasks_query(user_id: int):
    return select(Task).join(Subject).where(Subject.user_id == user_id)


def crisis_score(task: Task, now: datetime) -> int:
    score = 0
    deadline = normalize_dt(task.deadline)

    if task.status == TaskStatus.DEBT:
        score += 100

    if deadline is not None:
        today = now.date()
        tomorrow = today + timedelta(days=1)

        if deadline < now:
            score += 90
        elif deadline.date() == today:
            score += 80
        elif deadline.date() == tomorrow:
            score += 60
        elif deadline <= now + timedelta(days=3):
            score += 40

    if task.priority == TaskPriority.CRITICAL:
        score += 50
    elif task.priority == TaskPriority.HIGH:
        score += 30

    if task.estimated_hours is not None:
        if task.estimated_hours >= 8:
            score += 25
        elif task.estimated_hours >= 4:
            score += 15
        elif task.estimated_hours >= 2:
            score += 5

    if task.type == TaskType.COURSEWORK:
        score += 35
    elif task.type == TaskType.LAB:
        score += 15

    if task.status == TaskStatus.NOT_STARTED:
        score += 20
    elif task.status == TaskStatus.IN_PROGRESS:
        score += 10

    return score


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)

    total_subjects = db.scalar(select(func.count(Subject.id)).where(Subject.user_id == current_user.id)) or 0

    def count_tasks(*filters) -> int:
        return (
            db.scalar(
                select(func.count(Task.id))
                .join(Subject)
                .where(Subject.user_id == current_user.id, *filters)
            )
            or 0
        )

    total_tasks = count_tasks()
    accepted_tasks = count_tasks(Task.status == TaskStatus.ACCEPTED)
    in_progress_tasks = count_tasks(Task.status == TaskStatus.IN_PROGRESS)
    debt_tasks = count_tasks(Task.status == TaskStatus.DEBT)
    overdue_tasks = count_tasks(
        Task.deadline.is_not(None),
        Task.deadline < now,
        Task.status != TaskStatus.ACCEPTED,
    )
    nearest_deadline = db.scalar(
        select(func.min(Task.deadline)).join(Subject).where(
            Subject.user_id == current_user.id,
            Task.deadline.is_not(None),
            Task.deadline >= now,
            Task.status != TaskStatus.ACCEPTED,
        )
    )
    progress_percent = round((accepted_tasks / total_tasks) * 100, 2) if total_tasks else 0.0

    return {
        "total_subjects": total_subjects,
        "total_tasks": total_tasks,
        "accepted_tasks": accepted_tasks,
        "in_progress_tasks": in_progress_tasks,
        "debt_tasks": debt_tasks,
        "overdue_tasks": overdue_tasks,
        "progress_percent": progress_percent,
        "nearest_deadline": normalize_dt(nearest_deadline),
    }


@router.get("/crisis", response_model=list[CrisisTask])
def crisis_dashboard(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    tasks = list(db.scalars(user_tasks_query(current_user.id)))

    ranked = sorted(
        tasks,
        key=lambda task: (
            -crisis_score(task, now),
            normalize_dt(task.deadline) or datetime.max.replace(tzinfo=timezone.utc),
            task.created_at,
        ),
    )

    response: list[CrisisTask] = []
    for task in ranked[:limit]:
        data = TaskRead.model_validate(task).model_dump()
        data["crisis_score"] = crisis_score(task, now)
        response.append(CrisisTask(**data))

    return response
