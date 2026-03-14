import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Contribution(Base):
    __tablename__ = "contributions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id: Mapped[str] = mapped_column(String, ForeignKey("items.id", ondelete="CASCADE"), nullable=False, index=True)
    contributor_name: Mapped[str] = mapped_column(String, nullable=False)
    contributor_user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    contributor_token: Mapped[str] = mapped_column(String, nullable=False, default=lambda: secrets.token_urlsafe(24))
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    item: Mapped["Item"] = relationship("Item", back_populates="contributions")
