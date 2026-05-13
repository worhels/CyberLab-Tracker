from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.task import TaskPriority, TaskStatus, TaskType


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    deadline: datetime | None = None
    subject_id: int
    type: TaskType = TaskType.OTHER
    priority: TaskPriority = TaskPriority.MEDIUM
    github_url: str | None = Field(default=None, max_length=500)
    moodle_url: str | None = Field(default=None, max_length=500)
    report_file: str | None = Field(default=None, max_length=500)
    estimated_hours: int | None = Field(default=None, ge=0)
    submitted_at: datetime | None = None
    accepted_at: datetime | None = None


class TaskCreate(TaskBase):
    status: TaskStatus = TaskStatus.NOT_STARTED


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    deadline: datetime | None = None
    subject_id: int | None = None
    type: TaskType | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    github_url: str | None = Field(default=None, max_length=500)
    moodle_url: str | None = Field(default=None, max_length=500)
    report_file: str | None = Field(default=None, max_length=500)
    estimated_hours: int | None = Field(default=None, ge=0)
    submitted_at: datetime | None = None
    accepted_at: datetime | None = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskRead(TaskBase):
    id: int
    status: TaskStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
