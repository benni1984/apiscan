"""add location privacy columns to apiaries

Revision ID: 002
Revises: 001
Create Date: 2026-05-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("apiaries", sa.Column("city_name", sa.String(), nullable=True))
    op.add_column("apiaries", sa.Column("city_latitude", sa.Float(), nullable=True))
    op.add_column("apiaries", sa.Column("city_longitude", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("apiaries", "city_longitude")
    op.drop_column("apiaries", "city_latitude")
    op.drop_column("apiaries", "city_name")
