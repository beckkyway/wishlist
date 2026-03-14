"""Initial migration

Revision ID: 0001
Revises:
Create Date: 2026-03-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(), nullable=True),
        sa.Column("google_id", sa.String(), unique=True, nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "wishlists",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("occasion", sa.String(), nullable=True),
        sa.Column("share_token", sa.String(), unique=True, nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_wishlists_user_id", "wishlists", ["user_id"])

    op.create_table(
        "items",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("wishlist_id", sa.String(), sa.ForeignKey("wishlists.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("price", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(10), default="RUB"),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), default="available"),
        sa.Column("is_group_gift", sa.Boolean(), default=False),
        sa.Column("target_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("order_index", sa.Integer(), default=0),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_items_wishlist_id", "items", ["wishlist_id"])

    op.create_table(
        "reservations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("item_id", sa.String(), sa.ForeignKey("items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reserver_name", sa.String(), nullable=False),
        sa.Column("reserver_user_id", sa.String(), nullable=True),
        sa.Column("reserver_token", sa.String(), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("item_id", name="uq_reservations_item_id"),
    )
    op.create_index("ix_reservations_item_id", "reservations", ["item_id"])

    op.create_table(
        "contributions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("item_id", sa.String(), sa.ForeignKey("items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contributor_name", sa.String(), nullable=False),
        sa.Column("contributor_user_id", sa.String(), nullable=True),
        sa.Column("contributor_token", sa.String(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_contributions_item_id", "contributions", ["item_id"])


def downgrade() -> None:
    op.drop_table("contributions")
    op.drop_table("reservations")
    op.drop_table("items")
    op.drop_table("wishlists")
    op.drop_table("users")
