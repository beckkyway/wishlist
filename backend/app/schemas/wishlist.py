from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class WishlistCreate(BaseModel):
    title: str
    description: Optional[str] = None
    occasion: Optional[str] = None


class WishlistUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    occasion: Optional[str] = None
    is_active: Optional[bool] = None


class WishlistResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    occasion: Optional[str]
    share_token: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WishlistStats(BaseModel):
    total_items: int
    available: int
    reserved: int
    collecting: int
    collected: int
    total_collected_amount: float
