from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.json_schema import SkipJsonSchema

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
    language: Language | SkipJsonSchema[None] = None
    theme: Theme | SkipJsonSchema[None] = None
    accent_color: AccentColor | SkipJsonSchema[None] = None
    dashboard_view: DashboardView | SkipJsonSchema[None] = None
    show_crisis_cube: bool | SkipJsonSchema[None] = None
    reduced_motion: bool | SkipJsonSchema[None] = None
    deadline_reminders: bool | SkipJsonSchema[None] = None

    @field_validator(
        "language",
        "theme",
        "accent_color",
        "dashboard_view",
        "show_crisis_cube",
        "reduced_motion",
        "deadline_reminders",
        mode="before",
    )
    @classmethod
    def reject_explicit_nulls(cls, value: object) -> object:
        if value is None:
            raise ValueError("Field may be omitted but cannot be null")
        return value
