from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.item import Item
from app.models.wishlist import Wishlist
from app.models.contribution import Contribution
from app.schemas.item import ContributionSummary, ItemResponse
from app.schemas.wishlist import WishlistResponse

router = APIRouter(prefix="/share", tags=["share"])


@router.get("/{token}", response_model=WishlistResponse)
async def get_public_wishlist(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Wishlist).where(Wishlist.share_token == token, Wishlist.is_active == True))
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    return wishlist


@router.get("/{token}/items", response_model=list[ItemResponse])
async def get_public_items(
    token: str,
    reserver_token: str | None = Query(default=None),
    contributor_token: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Wishlist).where(Wishlist.share_token == token, Wishlist.is_active == True))
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    result = await db.execute(
        select(Item)
        .where(Item.wishlist_id == wishlist.id)
        .order_by(Item.order_index, Item.created_at)
    )
    items = result.scalars().all()

    enriched = []
    for item in items:
        summary = None
        contrib_result = await db.execute(
            select(
                func.coalesce(func.sum(Contribution.amount), 0),
                func.count(Contribution.id),
            ).where(Contribution.item_id == item.id)
        )
        total, count = contrib_result.one()
        if item.is_group_gift or float(total) > 0:
            summary = ContributionSummary(total_collected=float(total), count=int(count))

        is_reserved_by_me = False
        if reserver_token and item.reservation:
            is_reserved_by_me = item.reservation.reserver_token == reserver_token

        data = ItemResponse.model_validate(item)
        data.contribution_summary = summary
        data.is_reserved_by_me = is_reserved_by_me
        enriched.append(data)

    return enriched
