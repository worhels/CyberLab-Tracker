from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


MentorArtifactTemplate = Literal["bcrypt-timing-web-v1"]
MentorArtifactLanguage = Literal["ru", "uk", "en"]
MentorArtifactRounds = Literal[10, 11, 12, 13]


class MentorArtifactRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    template: MentorArtifactTemplate
    goal: str = Field(min_length=1, max_length=2_000)
    language: MentorArtifactLanguage = "en"
    task_id: int | None = Field(default=None, ge=1)

    @field_validator("goal")
    @classmethod
    def normalize_goal(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Goal must not be blank")
        return normalized


class MentorArtifactSpec(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    schema_version: Literal["1"]
    template: MentorArtifactTemplate
    title: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=500)
    default_rounds: MentorArtifactRounds

    @field_validator("title", "description")
    @classmethod
    def normalize_model_text(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("Model text must not be blank")
        if any(ord(character) < 32 for character in normalized):
            raise ValueError("Control characters are not allowed")
        return normalized


class MentorArtifactFile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    path: str
    size_bytes: int
    sha256: str


class MentorArtifactResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    template: MentorArtifactTemplate
    title: str
    description: str
    default_rounds: MentorArtifactRounds
    language: MentorArtifactLanguage
    created_at: datetime
    files: list[MentorArtifactFile]
