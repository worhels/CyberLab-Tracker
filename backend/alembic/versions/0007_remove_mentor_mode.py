"""remove obsolete mentor mode

Revision ID: 0007_remove_mentor_mode
Revises: 0006_add_interface_languages
Create Date: 2026-07-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007_remove_mentor_mode"
down_revision: Union[str, None] = "0006_add_interface_languages"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("mentor_messages", "mode")


def downgrade() -> None:
    op.add_column(
        "mentor_messages",
        sa.Column("mode", sa.String(length=50), server_default="chat", nullable=False),
    )
