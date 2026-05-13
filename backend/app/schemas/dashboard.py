from datetime import datetime

from pydantic import BaseModel

from app.schemas.task import TaskRead


class DashboardSummary(BaseModel):
    total_subjects: int
    total_tasks: int
    accepted_tasks: int
    in_progress_tasks: int
    debt_tasks: int
    overdue_tasks: int
    progress_percent: float
    nearest_deadline: datetime | None


class CrisisTask(TaskRead):
    crisis_score: int
