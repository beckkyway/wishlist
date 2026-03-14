"""Add occasion_date, item priority, user soft delete

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("wishlists", sa.Column("occasion_date", sa.Date(), nullable=True))
    op.add_column("items", sa.Column("priority", sa.String(20), nullable=False, server_default="normal"))
    op.add_column("users", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "deleted_at")
    op.drop_column("items", "priority")
    op.drop_column("wishlists", "occasion_date")
