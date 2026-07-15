from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic import field_validator
from pydantic.json_schema import SkipJsonSchema


class SubjectBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    color: str = Field(default="#4f46e5", min_length=1, max_length=32)
    teacher: str | None = Field(default=None, max_length=255)
    semester: str | None = Field(default=None, max_length=80)
    description: str | None = None


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: str | SkipJsonSchema[None] = Field(default=None, min_length=1, max_length=120)
    color: str | SkipJsonSchema[None] = Field(default=None, min_length=1, max_length=32)
    teacher: str | None = Field(default=None, max_length=255)
    semester: str | None = Field(default=None, max_length=80)
    description: str | None = None

    @field_validator("name", "color", mode="before")
    @classmethod
    def reject_null_for_non_nullable_fields(cls, value: object) -> object:
        if value is None:
            raise ValueError("Field may be omitted but cannot be null")
        return value


class SubjectRead(SubjectBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
