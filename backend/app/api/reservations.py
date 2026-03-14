import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.item import Item
from app.models.reservation import Reservation
from app.schemas.reservation import CancelReservationRequest, ReserveRequest, ReserveResponse

router = APIRouter(prefix="/items", tags=["reservations"])


@router.post("/{item_id}/reserve", response_model=ReserveResponse, status_code=201)
async def reserve_item(item_id: str, body: ReserveRequest, db: AsyncSession = Depends(get_db)):
    # Lock the item row
    result = await db.execute(select(Item).where(Item.id == item_id).with_for_update())
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.status == "deleted":
        raise HTTPException(status_code=409, detail="Item has been removed")
    if item.status == "reserved":
        raise HTTPException(status_code=409, detail="Item already reserved")

    token = body.reserver_token or secrets.token_urlsafe(24)

    reservation = Reservation(
        item_id=item_id,
        reserver_name=body.reserver_name,
        reserver_token=token,
    )
    item.status = "reserved"
    db.add(reservation)
    await db.commit()
    await db.refresh(reservation)
    return ReserveResponse(reservation_id=reservation.id, reserver_token=token)


@router.delete("/{item_id}/reserve", status_code=204)
async def cancel_reservation(item_id: str, body: CancelReservationRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Reservation).where(
            Reservation.item_id == item_id,
            Reservation.reserver_token == body.reserver_token,
        )
    )
    reservation = result.scalar_one_or_none()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if item:
        item.status = "available"

    await db.delete(reservation)
    await db.commit()
