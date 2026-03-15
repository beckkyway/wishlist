from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.item import Item
from app.models.wishlist import Wishlist
from app.models.contribution import Contribution
from app.models.user import User
from app.schemas.item import ItemCreate, ItemResponse, ItemUpdate, ContributionSummary

router = APIRouter(tags=["items"])


async def _enrich_item(item: Item, db: AsyncSession, reserver_token: str | None = None) -> ItemResponse:
    summary = None
    if item.is_group_gift:
        result = await db.execute(
            select(
                func.coalesce(func.sum(Contribution.amount), 0),
                func.count(Contribution.id),
            ).where(Contribution.item_id == item.id)
        )
        total, count = result.one()
        summary = ContributionSummary(total_collected=float(total), count=int(count))

    is_reserved_by_me = False
    if reserver_token and item.reservation:
        is_reserved_by_me = item.reservation.reserver_token == reserver_token

    data = ItemResponse.model_validate(item)
    data.contribution_summary = summary
    data.is_reserved_by_me = is_reserved_by_me
    return data


@router.get("/wishlists/{wishlist_id}/items", response_model=list[ItemResponse])
async def list_items(
    wishlist_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_wishlist_owner(wishlist_id, current_user.id, db)
    result = await db.execute(
        select(Item)
        .where(Item.wishlist_id == wishlist_id, Item.status != "deleted")
        .order_by(Item.order_index, Item.created_at)
    )
    items = result.scalars().all()
    enriched = []
    for item in items:
        item_resp = await _enrich_item(item, db)
        # Hide reservation status from the wishlist owner — only guests should know
        if item_resp.status == "reserved":
            item_resp.status = "available"
        enriched.append(item_resp)
    return enriched


@router.post("/wishlists/{wishlist_id}/items", response_model=ItemResponse, status_code=201)
async def create_item(
    wishlist_id: str,
    body: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_wishlist_owner(wishlist_id, current_user.id, db)
    item = Item(wishlist_id=wishlist_id, **body.model_dump())
    if item.is_group_gift:
        item.status = "collecting"
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return await _enrich_item(item, db)


@router.patch("/wishlists/{wishlist_id}/items/{item_id}", response_model=ItemResponse)
async def update_item(
    wishlist_id: str,
    item_id: str,
    body: ItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_owned_item(wishlist_id, item_id, current_user.id, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return await _enrich_item(item, db)


@router.delete("/wishlists/{wishlist_id}/items/{item_id}", status_code=204)
async def delete_item(
    wishlist_id: str,
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_owned_item(wishlist_id, item_id, current_user.id, db)
    item.status = "deleted"
    await db.commit()


async def _check_wishlist_owner(wishlist_id: str, user_id: str, db: AsyncSession):
    result = await db.execute(select(Wishlist).where(Wishlist.id == wishlist_id))
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if wishlist.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return wishlist


async def _get_owned_item(wishlist_id: str, item_id: str, user_id: str, db: AsyncSession) -> Item:
    await _check_wishlist_owner(wishlist_id, user_id, db)
    result = await db.execute(select(Item).where(Item.id == item_id, Item.wishlist_id == wishlist_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
