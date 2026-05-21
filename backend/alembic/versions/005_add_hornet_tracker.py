"""add hornet tracker tables

Revision ID: 005
Revises: 004
Create Date: 2026-05-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    # Create enums for PostgreSQL (SQLite uses VARCHAR)
    if dialect == "postgresql":
        op.execute(
            "CREATE TYPE nest_status_enum AS ENUM "
            "('found', 'destruction_ordered', 'destroyed')"
        )
        op.execute(
            "CREATE TYPE sighting_status_enum AS ENUM "
            "('pending', 'confirmed', 'rejected')"
        )

    nest_status_col = (
        sa.Enum("found", "destruction_ordered", "destroyed", name="nest_status_enum")
        if dialect == "postgresql"
        else sa.String
    )
    sighting_status_col = (
        sa.Enum("pending", "confirmed", "rejected", name="sighting_status_enum")
        if dialect == "postgresql"
        else sa.String
    )

    op.create_table(
        "hornet_catches",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("latitude", sa.Float, nullable=True),
        sa.Column("longitude", sa.Float, nullable=True),
        sa.Column("count", sa.Integer, nullable=False, server_default="1"),
        sa.Column("reporter_name", sa.String, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "hornet_nests",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("latitude", sa.Float, nullable=False),
        sa.Column("longitude", sa.Float, nullable=False),
        sa.Column("status", nest_status_col, nullable=False, server_default="found"),
        sa.Column("reporter_name", sa.String, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("photo_url", sa.String, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "hornet_sightings",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("photo_url", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("reporter_name", sa.String, nullable=True),
        sa.Column("latitude", sa.Float, nullable=True),
        sa.Column("longitude", sa.Float, nullable=True),
        sa.Column("status", sighting_status_col, nullable=False, server_default="pending"),
        sa.Column("yes_votes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("no_votes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    op.drop_table("hornet_sightings")
    op.drop_table("hornet_nests")
    op.drop_table("hornet_catches")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP TYPE IF EXISTS sighting_status_enum")
        op.execute("DROP TYPE IF EXISTS nest_status_enum")
