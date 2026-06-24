from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud import user_settings as settings_crud
from app.db.session import get_db
from app.models.user import User
from app.schemas.user_settings import UserSettingsRead, UserSettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/me", response_model=UserSettingsRead)
def read_my_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return settings_crud.get_or_create_user_settings(db, current_user.id)


@router.patch("/me", response_model=UserSettingsRead)
def update_my_settings(
    payload: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return settings_crud.update_user_settings(db, current_user.id, payload)
