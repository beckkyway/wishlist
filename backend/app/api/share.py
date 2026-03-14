from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.models.item import Item
from app.models.wishlist import Wishlist
from app.models.contribution import Contribution
from app.schemas.item import ContributionSummary, ItemResponse
from app.schemas.wishlist import WishlistResponse

router = APIRouter(prefix="/share", tags=["share"])


class DeletedContributionCheck(BaseModel):
    item_id: str
    contributor_token: str


class DeletedContributionResult(BaseModel):
    item_id: str
    item_title: str
    your_amount: float


class ContributionPublicInfo(BaseModel):
    contributor_name: str
    amount: float
    note: Optional[str] = None


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


@router.post("/{token}/check-deleted-contributions", response_model=list[DeletedContributionResult])
async def check_deleted_contributions(
    token: str,
    checks: list[DeletedContributionCheck],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Wishlist).where(Wishlist.share_token == token, Wishlist.is_active == True))
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    found = []
    for check in checks:
        item_result = await db.execute(
            select(Item).where(
                Item.id == check.item_id,
                Item.wishlist_id == wishlist.id,
                Item.status == "deleted",
            )
        )
        item = item_result.scalar_one_or_none()
        if not item:
            continue

        contrib_result = await db.execute(
            select(Contribution).where(
                Contribution.item_id == check.item_id,
                Contribution.contributor_token == check.contributor_token,
            )
        )
        contrib = contrib_result.scalar_one_or_none()
        if contrib:
            found.append(DeletedContributionResult(
                item_id=item.id,
                item_title=item.title,
                your_amount=float(contrib.amount),
            ))

    return found


@router.get("/{token}/items/{item_id}/contributions", response_model=list[ContributionPublicInfo])
async def get_item_contributions_public(
    token: str,
    item_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Wishlist).where(Wishlist.share_token == token, Wishlist.is_active == True))
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    item_result = await db.execute(
        select(Item).where(Item.id == item_id, Item.wishlist_id == wishlist.id)
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    contrib_result = await db.execute(
        select(Contribution)
        .where(Contribution.item_id == item_id)
        .order_by(Contribution.created_at)
    )
    contributions = contrib_result.scalars().all()

    return [
        ContributionPublicInfo(
            contributor_name=c.contributor_name,
            amount=float(c.amount),
            note=c.note,
        )
        for c in contributions
    ]
