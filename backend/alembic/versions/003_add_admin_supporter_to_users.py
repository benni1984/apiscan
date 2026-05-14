"""add is_admin and is_supporter to users

Revision ID: 003
Revises: 002
Create Date: 2026-05-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=True, server_default="0"))
    op.add_column("users", sa.Column("is_supporter", sa.Boolean(), nullable=True, server_default="0"))


def downgrade() -> None:
    op.drop_column("users", "is_supporter")
    op.drop_column("users", "is_admin")
