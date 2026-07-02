from datetime import datetime

from pydantic import BaseModel

from app.schemas.subject import SubjectRead
from app.schemas.task import TaskRead


class WorkspaceExportRead(BaseModel):
    exported_at: datetime
    subjects: list[SubjectRead]
    tasks: list[TaskRead]
