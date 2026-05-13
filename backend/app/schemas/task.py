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


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskRead(TaskBase):
    id: int
    status: TaskStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
