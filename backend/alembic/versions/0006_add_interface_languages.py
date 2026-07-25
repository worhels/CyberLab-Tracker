"""add interface languages

Revision ID: 0006_add_interface_languages
Revises: 0005_add_mentor_messages
Create Date: 2026-07-15
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0006_add_interface_languages"
down_revision: Union[str, None] = "0005_add_mentor_messages"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_LANGUAGES = ("es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi", "tr")


def upgrade() -> None:
    with op.get_context().autocommit_block():
        for language in NEW_LANGUAGES:
            op.execute(f"ALTER TYPE language_enum ADD VALUE IF NOT EXISTS '{language}'")


def downgrade() -> None:
    # PostgreSQL enum values cannot be removed safely while rows may use them.
    op.execute("UPDATE user_settings SET language = 'en' WHERE language IN "
               "('es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi', 'tr')")
