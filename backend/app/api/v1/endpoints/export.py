import csv
from datetime import datetime, timezone
from io import StringIO

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud import subjects as subject_crud
from app.crud import tasks as task_crud
from app.db.session import get_db
from app.models.subject import Subject
from app.models.task import Task
from app.models.user import User
from app.schemas.export import WorkspaceExportRead
from app.schemas.subject import SubjectRead
from app.schemas.task import TaskRead

router = APIRouter(prefix="/export", tags=["export"])

CSV_FIELDS = [
    "exported_at",
    "record_type",
    "id",
    "user_id",
    "subject_id",
    "name",
    "title",
    "description",
    "color",
    "teacher",
    "semester",
    "type",
    "status",
    "priority",
    "deadline",
    "estimated_hours",
    "github_url",
    "moodle_url",
    "report_file",
    "submitted_at",
    "accepted_at",
    "created_at",
    "updated_at",
]


def isoformat(value: datetime | None) -> str:
    return value.isoformat() if value else ""


def export_filename(exported_at: datetime, extension: str) -> str:
    timestamp = exported_at.strftime("%Y%m%d-%H%M%S")
    return f"cyberlab-export-{timestamp}.{extension}"


def load_workspace_data(db: Session, user_id: int) -> tuple[list[Subject], list[Task]]:
    return (
        subject_crud.list_subjects(db, user_id),
        task_crud.list_tasks(db, user_id),
    )


@router.get("/json", response_model=WorkspaceExportRead)
def export_json(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkspaceExportRead:
    exported_at = datetime.now(timezone.utc)
    subjects, tasks = load_workspace_data(db, current_user.id)
    response.headers["Content-Disposition"] = (
        f'attachment; filename="{export_filename(exported_at, "json")}"'
    )
    return WorkspaceExportRead(
        exported_at=exported_at,
        subjects=[SubjectRead.model_validate(subject) for subject in subjects],
        tasks=[TaskRead.model_validate(task) for task in tasks],
    )


@router.get("/csv")
def export_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    exported_at = datetime.now(timezone.utc)
    exported_at_value = exported_at.isoformat()
    subjects, tasks = load_workspace_data(db, current_user.id)
    output = StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=CSV_FIELDS)
    writer.writeheader()

    for subject in subjects:
        writer.writerow(
            {
                "exported_at": exported_at_value,
                "record_type": "subject",
                "id": subject.id,
                "user_id": subject.user_id,
                "name": subject.name,
                "description": subject.description,
                "color": subject.color,
                "teacher": subject.teacher,
                "semester": subject.semester,
                "created_at": isoformat(subject.created_at),
                "updated_at": isoformat(subject.updated_at),
            }
        )

    for task in tasks:
        writer.writerow(
            {
                "exported_at": exported_at_value,
                "record_type": "task",
                "id": task.id,
                "user_id": current_user.id,
                "subject_id": task.subject_id,
                "title": task.title,
                "description": task.description,
                "type": task.type.value,
                "status": task.status.value,
                "priority": task.priority.value,
                "deadline": isoformat(task.deadline),
                "estimated_hours": task.estimated_hours,
                "github_url": task.github_url,
                "moodle_url": task.moodle_url,
                "report_file": task.report_file,
                "submitted_at": isoformat(task.submitted_at),
                "accepted_at": isoformat(task.accepted_at),
                "created_at": isoformat(task.created_at),
                "updated_at": isoformat(task.updated_at),
            }
        )

    filename = export_filename(exported_at, "csv")
    return Response(
        content=f"\ufeff{output.getvalue()}",
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
