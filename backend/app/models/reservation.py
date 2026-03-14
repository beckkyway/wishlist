import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Reservation(Base):
    __tablename__ = "reservations"
    __table_args__ = (UniqueConstraint("item_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id: Mapped[str] = mapped_column(String, ForeignKey("items.id", ondelete="CASCADE"), nullable=False, index=True)
    reserver_name: Mapped[str] = mapped_column(String, nullable=False)
    reserver_user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    reserver_token: Mapped[str] = mapped_column(String, unique=True, nullable=False, default=lambda: secrets.token_urlsafe(24))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    item: Mapped["Item"] = relationship("Item", back_populates="reservation")
