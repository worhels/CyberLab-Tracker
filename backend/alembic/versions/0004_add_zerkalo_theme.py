"""add zerkalo theme

Revision ID: 0004_add_zerkalo_theme
Revises: 0003_add_user_settings
Create Date: 2026-06-25
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0004_add_zerkalo_theme"
down_revision: Union[str, None] = "0003_add_user_settings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE theme_enum ADD VALUE IF NOT EXISTS 'zerkalo'")
    op.execute("UPDATE user_settings SET theme = 'zerkalo' WHERE theme = 'system'")


def downgrade() -> None:
    op.execute("UPDATE user_settings SET theme = 'system' WHERE theme = 'zerkalo'")
