from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ReserveRequest(BaseModel):
    reserver_name: str
    reserver_token: Optional[str] = None


class ReserveResponse(BaseModel):
    reservation_id: str
    reserver_token: str


class CancelReservationRequest(BaseModel):
    reserver_token: str
