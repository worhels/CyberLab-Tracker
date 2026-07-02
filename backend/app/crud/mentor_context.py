from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subject import Subject
from app.models.task import Task, TaskPriority, TaskStatus

SUBJECT_LIST_LIMIT = 20
ACTIVE_TASK_LIST_LIMIT = 20
COMPLETED_TASK_LIST_LIMIT = 10
SUBJECT_DESCRIPTION_LIMIT = 800
TASK_DESCRIPTION_LIMIT = 1_500

AVAILABLE_ROUTES = [
    {
        "path": "/dashboard",
        "purpose": "Сводка нагрузки, прогресса, просрочек, очереди приоритетов и прогресса по предметам.",
    },
    {
        "path": "/subjects",
        "purpose": "Создание и просмотр предметов, создание задач для выбранного предмета.",
    },
    {
        "path": "/tasks",
        "purpose": "Список и фильтрация задач, изменение статуса, выбор задачи или предмета для Mentor.",
    },
    {
        "path": "/crisis",
        "purpose": "Ранжирование активных задач по риску и давлению дедлайнов.",
    },
    {
        "path": "/settings",
        "purpose": "Настройки интерфейса и экспорт данных пользователя.",
    },
]

PAGE_PURPOSES = {item["path"]: item["purpose"] for item in AVAILABLE_ROUTES}

PRIORITY_ORDER = {
    TaskPriority.CRITICAL: 0,
    TaskPriority.HIGH: 1,
    TaskPriority.MEDIUM: 2,
    TaskPriority.LOW: 3,
}


def normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def truncate_text(value: str | None, limit: int) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    if len(normalized) <= limit:
        return normalized
    return f"{normalized[: limit - 1]}…"


def is_overdue(task: Task, now: datetime) -> bool:
    deadline = normalize_datetime(task.deadline)
    return (
        deadline is not None
        and deadline < now
        and task.status != TaskStatus.ACCEPTED
    )


def task_summary(task: Task, subject_name: str | None) -> dict[str, object]:
    return {
        "id": task.id,
        "title": task.title,
        "subject_id": task.subject_id,
        "subject_name": subject_name,
        "type": task.type.value,
        "status": task.status.value,
        "priority": task.priority.value,
        "deadline": task.deadline.isoformat() if task.deadline is not None else None,
        "estimated_hours": task.estimated_hours,
    }


def selected_task_details(task: Task, subject_name: str | None) -> dict[str, object]:
    return {
        **task_summary(task, subject_name),
        "description": truncate_text(task.description, TASK_DESCRIPTION_LIMIT),
        "github_url": task.github_url,
        "moodle_url": task.moodle_url,
        "report_file": task.report_file,
        "submitted_at": task.submitted_at.isoformat() if task.submitted_at is not None else None,
        "accepted_at": task.accepted_at.isoformat() if task.accepted_at is not None else None,
    }


def selected_subject_details(subject: Subject) -> dict[str, object]:
    return {
        "id": subject.id,
        "name": subject.name,
        "teacher": subject.teacher,
        "semester": subject.semester,
        "description": truncate_text(subject.description, SUBJECT_DESCRIPTION_LIMIT),
    }


def build_workspace_context(
    db: Session,
    *,
    user_id: int,
    page: str,
    selected_subject: Subject | None,
    selected_task: Task | None,
) -> dict[str, object]:
    now = datetime.now(timezone.utc)
    subjects = list(
        db.scalars(
            select(Subject)
            .where(Subject.user_id == user_id)
            .order_by(Subject.name, Subject.id)
        )
    )
    tasks = list(
        db.scalars(
            select(Task)
            .join(Subject)
            .where(Subject.user_id == user_id)
        )
    )
    subject_by_id = {subject.id: subject for subject in subjects}
    tasks_by_subject: dict[int, list[Task]] = {}
    for task in tasks:
        tasks_by_subject.setdefault(task.subject_id, []).append(task)

    accepted_tasks = [task for task in tasks if task.status == TaskStatus.ACCEPTED]
    active_tasks = [task for task in tasks if task.status != TaskStatus.ACCEPTED]
    overdue_tasks = [task for task in tasks if is_overdue(task, now)]
    upcoming_deadlines = [
        normalize_datetime(task.deadline)
        for task in active_tasks
        if normalize_datetime(task.deadline) is not None
        and normalize_datetime(task.deadline) >= now
    ]
    nearest_deadline = min(upcoming_deadlines) if upcoming_deadlines else None
    status_counts = {
        status.value: sum(1 for task in tasks if task.status == status)
        for status in TaskStatus
    }

    subject_summaries: list[dict[str, object]] = []
    for subject in subjects[:SUBJECT_LIST_LIMIT]:
        subject_tasks = tasks_by_subject.get(subject.id, [])
        subject_accepted = sum(
            1 for task in subject_tasks if task.status == TaskStatus.ACCEPTED
        )
        subject_summaries.append(
            {
                "id": subject.id,
                "name": subject.name,
                "teacher": subject.teacher,
                "semester": subject.semester,
                "description": truncate_text(subject.description, 240),
                "task_counts": {
                    "total": len(subject_tasks),
                    "accepted": subject_accepted,
                    "active": len(subject_tasks) - subject_accepted,
                    "debt": sum(
                        1 for task in subject_tasks if task.status == TaskStatus.DEBT
                    ),
                    "overdue": sum(
                        1 for task in subject_tasks if is_overdue(task, now)
                    ),
                },
            }
        )

    far_future = datetime.max.replace(tzinfo=timezone.utc)
    active_tasks.sort(
        key=lambda task: (
            normalize_datetime(task.deadline) or far_future,
            PRIORITY_ORDER.get(task.priority, 4),
            task.id,
        )
    )
    epoch = datetime.min.replace(tzinfo=timezone.utc)
    accepted_tasks.sort(
        key=lambda task: normalize_datetime(task.updated_at) or epoch,
        reverse=True,
    )
    context_tasks = (
        active_tasks[:ACTIVE_TASK_LIST_LIMIT]
        + accepted_tasks[:COMPLETED_TASK_LIST_LIMIT]
    )
    task_summaries = [
        task_summary(
            task,
            subject_by_id.get(task.subject_id).name
            if subject_by_id.get(task.subject_id) is not None
            else None,
        )
        for task in context_tasks
    ]

    normalized_page = page.split("?", maxsplit=1)[0]
    context: dict[str, object] = {
        "source": "sqlalchemy_read_only_current_user",
        "generated_at": now.isoformat(),
        "current_page": {
            "path": normalized_page,
            "purpose": PAGE_PURPOSES.get(
                normalized_page,
                "Неизвестный маршрут. Не выдумывай назначение этой страницы.",
            ),
        },
        "application_capabilities": {
            "available_routes": AVAILABLE_ROUTES,
            "subjects_have_status": False,
            "subject_status_explanation": (
                "У предметов нет статуса open/closed. Статусы принадлежат только задачам."
            ),
            "task_statuses": [status.value for status in TaskStatus],
            "mentor_database_access": (
                "Mentor получает только подготовленный read-only контекст текущего пользователя; "
                "он не выполняет SQL и не может изменять данные."
            ),
        },
        "workspace_summary": {
            "total_subjects": len(subjects),
            "total_tasks": len(tasks),
            "accepted_tasks": len(accepted_tasks),
            "active_tasks": len(active_tasks),
            "in_progress_tasks": status_counts[TaskStatus.IN_PROGRESS.value],
            "debt_tasks": status_counts[TaskStatus.DEBT.value],
            "overdue_tasks": len(overdue_tasks),
            "progress_percent": (
                round((len(accepted_tasks) / len(tasks)) * 100, 2)
                if tasks
                else 0.0
            ),
            "nearest_deadline": (
                nearest_deadline.isoformat() if nearest_deadline is not None else None
            ),
            "task_status_counts": status_counts,
        },
        "subjects": subject_summaries,
        "tasks": task_summaries,
        "context_limits": {
            "subjects_included": len(subject_summaries),
            "subjects_total": len(subjects),
            "tasks_included": len(task_summaries),
            "tasks_total": len(tasks),
        },
    }
    if selected_subject is not None:
        context["selected_subject"] = selected_subject_details(selected_subject)
    if selected_task is not None:
        subject = subject_by_id.get(selected_task.subject_id)
        context["selected_task"] = selected_task_details(
            selected_task,
            subject.name if subject is not None else None,
        )

    return context
