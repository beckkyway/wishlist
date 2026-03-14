from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ItemCreate(BaseModel):
    title: str
    url: Optional[str] = None
    price: Optional[float] = None
    currency: str = "RUB"
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_group_gift: bool = False
    target_amount: Optional[float] = None
    order_index: int = 0
    priority: str = "normal"


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_group_gift: Optional[bool] = None
    target_amount: Optional[float] = None
    order_index: Optional[int] = None
    priority: Optional[str] = None


class ContributionSummary(BaseModel):
    total_collected: float
    count: int


class ItemResponse(BaseModel):
    id: str
    wishlist_id: str
    title: str
    url: Optional[str]
    price: Optional[float]
    currency: str
    image_url: Optional[str]
    description: Optional[str]
    status: str
    is_group_gift: bool
    target_amount: Optional[float]
    order_index: int
    priority: str
    created_at: datetime
    updated_at: datetime
    contribution_summary: Optional[ContributionSummary] = None
    is_reserved_by_me: bool = False

    model_config = {"from_attributes": True}
