from pydantic import BaseModel, ConfigDict

from app.models.user_settings import AccentColor, DashboardView, Language, Theme


class UserSettingsBase(BaseModel):
    language: Language = Language.RU
    theme: Theme = Theme.ZERKALO
    accent_color: AccentColor = AccentColor.BLUE
    dashboard_view: DashboardView = DashboardView.COMFORTABLE
    show_crisis_cube: bool = True
    reduced_motion: bool = False
    deadline_reminders: bool = True


class UserSettingsRead(UserSettingsBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class UserSettingsUpdate(BaseModel):
    language: Language | None = None
    theme: Theme | None = None
    accent_color: AccentColor | None = None
    dashboard_view: DashboardView | None = None
    show_crisis_cube: bool | None = None
    reduced_motion: bool | None = None
    deadline_reminders: bool | None = None
