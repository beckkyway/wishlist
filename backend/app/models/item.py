import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Boolean, ForeignKey, Text, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Item(Base):
    __tablename__ = "items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    wishlist_id: Mapped[str] = mapped_column(String, ForeignKey("wishlists.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="RUB")
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # available | reserved | collecting | collected | deleted
    status: Mapped[str] = mapped_column(String(20), default="available")
    is_group_gift: Mapped[bool] = mapped_column(Boolean, default=False)
    target_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    wishlist: Mapped["Wishlist"] = relationship("Wishlist", back_populates="items")
    reservation: Mapped["Reservation | None"] = relationship("Reservation", back_populates="item", uselist=False, cascade="all, delete-orphan")
    contributions: Mapped[list["Contribution"]] = relationship("Contribution", back_populates="item", cascade="all, delete-orphan")
