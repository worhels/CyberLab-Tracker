from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_settings import UserSettings
from app.schemas.user_settings import UserSettingsUpdate


def get_user_settings(db: Session, user_id: int) -> UserSettings | None:
    return db.scalar(select(UserSettings).where(UserSettings.user_id == user_id))


def create_default_user_settings(db: Session, user_id: int) -> UserSettings:
    settings = UserSettings(user_id=user_id)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def get_or_create_user_settings(db: Session, user_id: int) -> UserSettings:
    settings = get_user_settings(db, user_id)
    if settings is not None:
        return settings
    return create_default_user_settings(db, user_id)


def update_user_settings(db: Session, user_id: int, payload: UserSettingsUpdate) -> UserSettings:
    settings = get_or_create_user_settings(db, user_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)

    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings
