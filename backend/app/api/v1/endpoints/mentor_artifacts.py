import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud import crud_mentor
from app.db.session import get_db
from app.models.user import User
from app.schemas.mentor_artifact import MentorArtifactRequest, MentorArtifactResponse
from app.services import mentor_artifacts

router = APIRouter(prefix="/mentor", tags=["mentor"])
artifact_generation_semaphore = asyncio.Semaphore(1)


@router.post("/artifacts", response_model=MentorArtifactResponse, status_code=status.HTTP_201_CREATED)
async def create_mentor_artifact(
    payload: MentorArtifactRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MentorArtifactResponse:
    if payload.task_id is not None:
        task = crud_mentor.get_current_task_context(db, current_user.id, payload.task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    async with artifact_generation_semaphore:
        mentor_artifacts.ensure_artifact_capacity(current_user.id)
        spec, model_digest = await asyncio.to_thread(
            mentor_artifacts.generate_artifact_spec,
            payload.goal,
            payload.language,
        )
        return await asyncio.to_thread(
            mentor_artifacts.create_artifact,
            user_id=current_user.id,
            task_id=payload.task_id,
            goal=payload.goal,
            language=payload.language,
            spec=spec,
            model_digest=model_digest,
        )


@router.get("/artifacts/{artifact_id}", response_model=MentorArtifactResponse)
def get_mentor_artifact(
    artifact_id: UUID,
    current_user: User = Depends(get_current_user),
) -> MentorArtifactResponse:
    return mentor_artifacts.read_artifact(current_user.id, artifact_id)


@router.get("/artifacts/{artifact_id}/download")
def download_mentor_artifact(
    artifact_id: UUID,
    current_user: User = Depends(get_current_user),
) -> Response:
    archive = mentor_artifacts.build_artifact_archive(current_user.id, artifact_id)
    return Response(
        content=archive,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="bcrypt-timing-{artifact_id}.zip"',
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )
