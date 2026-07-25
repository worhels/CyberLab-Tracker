from enum import Enum

from sqlalchemy import Boolean, ForeignKey
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Language(str, Enum):
    RU = "ru"
    UK = "uk"
    EN = "en"
    ES = "es"
    FR = "fr"
    DE = "de"
    PT = "pt"
    ZH = "zh"
    JA = "ja"
    KO = "ko"
    AR = "ar"
    HI = "hi"
    TR = "tr"


class Theme(str, Enum):
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"
    ZERKALO = "zerkalo"


class AccentColor(str, Enum):
    BLUE = "blue"
    PURPLE = "purple"
    GREEN = "green"
    ORANGE = "orange"
    RED = "red"


class DashboardView(str, Enum):
    COMPACT = "compact"
    COMFORTABLE = "comfortable"


def enum_values(items: type[Enum]) -> list[str]:
    return [item.value for item in items]


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    language: Mapped[Language] = mapped_column(
        SAEnum(Language, name="language_enum", values_callable=enum_values),
        default=Language.RU,
        nullable=False,
    )
    theme: Mapped[Theme] = mapped_column(
        SAEnum(Theme, name="theme_enum", values_callable=enum_values),
        default=Theme.ZERKALO,
        nullable=False,
    )
    accent_color: Mapped[AccentColor] = mapped_column(
        SAEnum(AccentColor, name="accent_color_enum", values_callable=enum_values),
        default=AccentColor.BLUE,
        nullable=False,
    )
    dashboard_view: Mapped[DashboardView] = mapped_column(
        SAEnum(DashboardView, name="dashboard_view_enum", values_callable=enum_values),
        default=DashboardView.COMFORTABLE,
        nullable=False,
    )
    show_crisis_cube: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reduced_motion: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deadline_reminders: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="settings")
