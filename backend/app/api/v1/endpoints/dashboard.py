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
from app.schemas.dashboard import CrisisDashboard, CrisisTask, DashboardSummary
from app.schemas.task import TaskRead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

ACTIVE_CRISIS_STATUSES = {
    TaskStatus.NOT_STARTED,
    TaskStatus.IN_PROGRESS,
    TaskStatus.SUBMITTED,
}

PRIORITY_PRESSURE_WEIGHT = {
    TaskPriority.LOW: 0.25,
    TaskPriority.MEDIUM: 0.5,
    TaskPriority.HIGH: 0.75,
    TaskPriority.CRITICAL: 1.0,
}

STATUS_PRESSURE_WEIGHT = {
    TaskStatus.NOT_STARTED: 1.0,
    TaskStatus.IN_PROGRESS: 0.75,
    TaskStatus.SUBMITTED: 0.35,
}


def normalize_dt(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def user_tasks_query(user_id: int, include_completed: bool = True):
    statement = select(Task).join(Subject).where(Subject.user_id == user_id)

    if not include_completed:
        statement = statement.where(Task.status != TaskStatus.ACCEPTED)

    return statement


def clamp_score(value: float) -> float:
    return min(max(value, 0.0), 1.0)


def is_active_crisis_task(task: Task) -> bool:
    return task.status in ACTIVE_CRISIS_STATUSES


def build_crisis_metrics(tasks: list[Task]) -> dict:
    total_count = len(tasks)
    active_tasks = [task for task in tasks if is_active_crisis_task(task)]
    accepted_count = sum(1 for task in tasks if task.status == TaskStatus.ACCEPTED)
    completion_ratio = accepted_count / total_count if total_count else 1.0

    pressure_raw = 0.0
    for task in active_tasks:
        priority_weight = PRIORITY_PRESSURE_WEIGHT.get(task.priority, 0.5)
        status_weight = STATUS_PRESSURE_WEIGHT.get(task.status, 0.75)
        pressure_raw += priority_weight * status_weight

    pressure_score = clamp_score(pressure_raw / len(active_tasks)) if active_tasks else 0.0
    cohesion_score = clamp_score(completion_ratio)
    instability_score = clamp_score(pressure_score * (1 - cohesion_score * 0.35))

    severity_counts = {
        "critical": sum(1 for task in active_tasks if task.priority == TaskPriority.CRITICAL),
        "high": sum(1 for task in active_tasks if task.priority == TaskPriority.HIGH),
        "medium": sum(1 for task in active_tasks if task.priority == TaskPriority.MEDIUM),
        "low": sum(1 for task in active_tasks if task.priority == TaskPriority.LOW),
    }

    return {
        "total_tasks": total_count,
        "accepted_tasks": accepted_count,
        "active_tasks": len(active_tasks),
        "completion_ratio": round(completion_ratio, 4),
        "pressure_score": round(pressure_score, 4),
        "cohesion_score": round(cohesion_score, 4),
        "instability_score": round(instability_score, 4),
        "severity_counts": severity_counts,
    }


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


@router.get("/crisis", response_model=CrisisDashboard)
def crisis_dashboard(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    include_completed: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    all_tasks = list(db.scalars(user_tasks_query(current_user.id)))
    task_pool = all_tasks if include_completed else [task for task in all_tasks if is_active_crisis_task(task)]

    ranked = sorted(
        task_pool,
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

    return {**build_crisis_metrics(all_tasks), "tasks": response}
