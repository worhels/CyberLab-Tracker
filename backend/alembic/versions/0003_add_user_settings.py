"""add user settings

Revision ID: 0003_add_user_settings
Revises: 0002_add_study_tracker_fields
Create Date: 2026-06-25
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_add_user_settings"
down_revision: Union[str, None] = "0002_add_study_tracker_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

language_enum = sa.Enum("ru", "uk", "en", name="language_enum")
theme_enum = sa.Enum("light", "dark", "system", name="theme_enum")
accent_color_enum = sa.Enum("blue", "purple", "green", "orange", "red", name="accent_color_enum")
dashboard_view_enum = sa.Enum("compact", "comfortable", name="dashboard_view_enum")


def upgrade() -> None:
    op.create_table(
        "user_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("language", language_enum, nullable=False),
        sa.Column("theme", theme_enum, nullable=False),
        sa.Column("accent_color", accent_color_enum, nullable=False),
        sa.Column("dashboard_view", dashboard_view_enum, nullable=False),
        sa.Column("show_crisis_cube", sa.Boolean(), nullable=False),
        sa.Column("reduced_motion", sa.Boolean(), nullable=False),
        sa.Column("deadline_reminders", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_settings_id"), "user_settings", ["id"], unique=False)
    op.create_index(op.f("ix_user_settings_user_id"), "user_settings", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_settings_user_id"), table_name="user_settings")
    op.drop_index(op.f("ix_user_settings_id"), table_name="user_settings")
    op.drop_table("user_settings")
    dashboard_view_enum.drop(op.get_bind(), checkfirst=True)
    accent_color_enum.drop(op.get_bind(), checkfirst=True)
    theme_enum.drop(op.get_bind(), checkfirst=True)
    language_enum.drop(op.get_bind(), checkfirst=True)
