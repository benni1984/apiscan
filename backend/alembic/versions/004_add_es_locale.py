"""add es to locale_enum

Revision ID: 004
Revises: 003
Create Date: 2026-05-15

"""
from typing import Sequence, Union

from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE locale_enum ADD VALUE IF NOT EXISTS 'es'")
    # SQLite: enum is a VARCHAR CHECK constraint that is not enforced at runtime


def downgrade() -> None:
    pass  # PostgreSQL cannot remove enum values; no-op
