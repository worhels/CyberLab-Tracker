"""add study tracker fields

Revision ID: 0002_add_study_tracker_fields
Revises: 0001_initial
Create Date: 2026-05-13
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_add_study_tracker_fields"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("subjects", sa.Column("teacher", sa.String(length=255), nullable=True))
    op.add_column("subjects", sa.Column("semester", sa.String(length=80), nullable=True))
    op.add_column("subjects", sa.Column("description", sa.Text(), nullable=True))

    op.add_column("tasks", sa.Column("github_url", sa.String(length=500), nullable=True))
    op.add_column("tasks", sa.Column("moodle_url", sa.String(length=500), nullable=True))
    op.add_column("tasks", sa.Column("report_file", sa.String(length=500), nullable=True))
    op.add_column("tasks", sa.Column("estimated_hours", sa.Integer(), nullable=True))
    op.add_column("tasks", sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("tasks", sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("tasks", "accepted_at")
    op.drop_column("tasks", "submitted_at")
    op.drop_column("tasks", "estimated_hours")
    op.drop_column("tasks", "report_file")
    op.drop_column("tasks", "moodle_url")
    op.drop_column("tasks", "github_url")

    op.drop_column("subjects", "description")
    op.drop_column("subjects", "semester")
    op.drop_column("subjects", "teacher")
