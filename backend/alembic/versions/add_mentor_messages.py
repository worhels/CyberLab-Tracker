"""add mentor messages

Revision ID: 0005_add_mentor_messages
Revises: 0004_add_zerkalo_theme
Create Date: 2026-07-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005_add_mentor_messages"
down_revision: Union[str, None] = "0004_add_zerkalo_theme"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "mentor_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.String(length=64), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("mode", sa.String(length=50), server_default=sa.text("'lab'"), nullable=False),
        sa.Column("page", sa.String(length=100), nullable=True),
        sa.Column("subject_id", sa.Integer(), nullable=True),
        sa.Column("task_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_mentor_messages_user_session_created_at",
        "mentor_messages",
        ["user_id", "session_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_mentor_messages_subject_id",
        "mentor_messages",
        ["subject_id"],
        unique=False,
    )
    op.create_index(
        "ix_mentor_messages_task_id",
        "mentor_messages",
        ["task_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_mentor_messages_task_id", table_name="mentor_messages")
    op.drop_index("ix_mentor_messages_subject_id", table_name="mentor_messages")
    op.drop_index("ix_mentor_messages_user_session_created_at", table_name="mentor_messages")
    op.drop_table("mentor_messages")
