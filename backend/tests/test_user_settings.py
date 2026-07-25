from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.crud.user_settings import get_or_create_user_settings, update_user_settings
from app.db.base import Base
from app.models import Subject, Task, User, UserSettings
from app.models.user_settings import AccentColor, DashboardView, Language, Theme
from app.schemas.user_settings import UserSettingsUpdate


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def create_user(db: Session) -> User:
    user = User(email="demo@example.com", hashed_password="hash", full_name="Demo User")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_get_or_create_user_settings_uses_defaults(db: Session) -> None:
    user = create_user(db)

    settings = get_or_create_user_settings(db, user.id)

    assert settings.user_id == user.id
    assert settings.language == Language.RU
    assert settings.theme == Theme.ZERKALO
    assert settings.accent_color == AccentColor.BLUE
    assert settings.dashboard_view == DashboardView.COMFORTABLE
    assert settings.show_crisis_cube is True
    assert settings.reduced_motion is False
    assert settings.deadline_reminders is True


def test_update_user_settings_updates_only_passed_fields(db: Session) -> None:
    user = create_user(db)

    settings = update_user_settings(
        db,
        user.id,
        UserSettingsUpdate(theme=Theme.DARK, show_crisis_cube=False),
    )
    same_settings = get_or_create_user_settings(db, user.id)

    assert same_settings.id == settings.id
    assert settings.theme == Theme.DARK
    assert settings.show_crisis_cube is False
    assert settings.language == Language.RU
    assert settings.accent_color == AccentColor.BLUE


@pytest.mark.parametrize(
    "language",
    [
        Language.ES,
        Language.FR,
        Language.DE,
        Language.PT,
        Language.ZH,
        Language.JA,
        Language.KO,
        Language.AR,
        Language.HI,
        Language.TR,
    ],
)
def test_update_user_settings_accepts_added_languages(
    db: Session,
    language: Language,
) -> None:
    user = create_user(db)

    settings = update_user_settings(
        db,
        user.id,
        UserSettingsUpdate(language=language),
    )

    assert settings.language == language


def test_user_settings_model_is_registered() -> None:
    assert Subject.__tablename__ == "subjects"
    assert Task.__tablename__ == "tasks"
    assert UserSettings.__tablename__ == "user_settings"
