from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def enum_values(items: type[Enum]) -> list[str]:
    return [str(item.value) for item in items]


class TaskType(str, Enum):
    LAB = "lab"
    PRACTICE = "practice"
    COURSEWORK = "coursework"
    EXAM = "exam"
    OTHER = "other"


class TaskStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    ACCEPTED = "accepted"
    DEBT = "debt"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    type: Mapped[TaskType] = mapped_column(
        SAEnum(TaskType, name="task_type", values_callable=enum_values),
        default=TaskType.OTHER,
        nullable=False,
        index=True,
    )
    status: Mapped[TaskStatus] = mapped_column(
        SAEnum(TaskStatus, name="task_status", values_callable=enum_values),
        default=TaskStatus.NOT_STARTED,
        nullable=False,
        index=True,
    )
    priority: Mapped[TaskPriority] = mapped_column(
        SAEnum(TaskPriority, name="task_priority", values_callable=enum_values),
        default=TaskPriority.MEDIUM,
        nullable=False,
        index=True,
    )
    github_url: Mapped[str | None] = mapped_column(String(500))
    moodle_url: Mapped[str | None] = mapped_column(String(500))
    report_file: Mapped[str | None] = mapped_column(String(500))
    estimated_hours: Mapped[int | None] = mapped_column(Integer)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    subject = relationship("Subject", back_populates="tasks")
