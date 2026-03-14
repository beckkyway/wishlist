from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.item import Item
from app.models.wishlist import Wishlist
from app.models.contribution import Contribution
from app.models.user import User
from app.schemas.wishlist import WishlistCreate, WishlistResponse, WishlistStats, WishlistUpdate

router = APIRouter(prefix="/wishlists", tags=["wishlists"])


@router.get("", response_model=list[WishlistResponse])
async def list_wishlists(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Wishlist).where(Wishlist.user_id == current_user.id).order_by(Wishlist.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=WishlistResponse, status_code=201)
async def create_wishlist(body: WishlistCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    wishlist = Wishlist(user_id=current_user.id, **body.model_dump())
    db.add(wishlist)
    await db.commit()
    await db.refresh(wishlist)
    return wishlist


@router.get("/{wishlist_id}", response_model=WishlistResponse)
async def get_wishlist(wishlist_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    wishlist = await _get_owned_wishlist(wishlist_id, current_user.id, db)
    return wishlist


@router.patch("/{wishlist_id}", response_model=WishlistResponse)
async def update_wishlist(wishlist_id: str, body: WishlistUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    wishlist = await _get_owned_wishlist(wishlist_id, current_user.id, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(wishlist, field, value)
    await db.commit()
    await db.refresh(wishlist)
    return wishlist


@router.delete("/{wishlist_id}", status_code=204)
async def delete_wishlist(wishlist_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    wishlist = await _get_owned_wishlist(wishlist_id, current_user.id, db)
    await db.delete(wishlist)
    await db.commit()


@router.get("/{wishlist_id}/stats", response_model=WishlistStats)
async def wishlist_stats(wishlist_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_owned_wishlist(wishlist_id, current_user.id, db)

    result = await db.execute(
        select(Item).where(Item.wishlist_id == wishlist_id, Item.status != "deleted")
    )
    items = result.scalars().all()

    item_ids = [i.id for i in items]
    total_collected = 0.0
    if item_ids:
        contrib_result = await db.execute(
            select(func.coalesce(func.sum(Contribution.amount), 0)).where(Contribution.item_id.in_(item_ids))
        )
        total_collected = float(contrib_result.scalar())

    return WishlistStats(
        total_items=len(items),
        available=sum(1 for i in items if i.status in ("available", "reserved")),
        reserved=0,  # reservations are hidden from the owner
        collecting=sum(1 for i in items if i.status == "collecting"),
        collected=sum(1 for i in items if i.status == "collected"),
        total_collected_amount=total_collected,
    )


async def _get_owned_wishlist(wishlist_id: str, user_id: str, db: AsyncSession) -> Wishlist:
    result = await db.execute(select(Wishlist).where(Wishlist.id == wishlist_id))
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if wishlist.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return wishlist
