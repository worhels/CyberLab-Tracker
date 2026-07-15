from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.json_schema import SkipJsonSchema

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

    @field_validator("deadline", "submitted_at", "accepted_at")
    @classmethod
    def normalize_input_datetimes(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Datetime values must include a UTC offset")
        return value.astimezone(timezone.utc)


class TaskUpdate(BaseModel):
    title: str | SkipJsonSchema[None] = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    deadline: datetime | None = None
    subject_id: int | SkipJsonSchema[None] = Field(default=None, ge=1)
    type: TaskType | SkipJsonSchema[None] = None
    priority: TaskPriority | SkipJsonSchema[None] = None
    status: TaskStatus | SkipJsonSchema[None] = None
    github_url: str | None = Field(default=None, max_length=500)
    moodle_url: str | None = Field(default=None, max_length=500)
    report_file: str | None = Field(default=None, max_length=500)
    estimated_hours: int | None = Field(default=None, ge=0)
    submitted_at: datetime | None = None
    accepted_at: datetime | None = None

    @field_validator("title", "subject_id", "type", "priority", "status", mode="before")
    @classmethod
    def reject_null_for_non_nullable_fields(cls, value: object) -> object:
        if value is None:
            raise ValueError("Field may be omitted but cannot be null")
        return value

    @field_validator("deadline", "submitted_at", "accepted_at")
    @classmethod
    def normalize_input_datetimes(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Datetime values must include a UTC offset")
        return value.astimezone(timezone.utc)


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskRead(TaskBase):
    id: int
    status: TaskStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
