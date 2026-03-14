import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.contribution import Contribution
from app.models.item import Item
from app.schemas.contribution import (
    ContributionCreate,
    ContributionResponse,
    ContributionSummaryResponse,
    DeleteContributionRequest,
)

router = APIRouter(tags=["contributions"])


@router.get("/items/{item_id}/contributions/summary", response_model=ContributionSummaryResponse)
async def contribution_summary(item_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            func.coalesce(func.sum(Contribution.amount), 0),
            func.count(Contribution.id),
        ).where(Contribution.item_id == item_id)
    )
    total, count = result.one()
    return ContributionSummaryResponse(total_collected=float(total), count=int(count))


@router.post("/items/{item_id}/contributions", response_model=ContributionResponse, status_code=201)
async def add_contribution(item_id: str, body: ContributionCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).where(Item.id == item_id).with_for_update())
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.status == "deleted":
        raise HTTPException(status_code=409, detail="Item has been removed")
    if item.status == "collected":
        raise HTTPException(status_code=409, detail="Goal already reached")

    token = body.contributor_token or secrets.token_urlsafe(24)
    contribution = Contribution(
        item_id=item_id,
        contributor_name=body.contributor_name,
        amount=body.amount,
        note=body.note,
        contributor_token=token,
    )
    db.add(contribution)
    await db.flush()

    # Check if goal reached
    total_result = await db.execute(
        select(func.coalesce(func.sum(Contribution.amount), 0)).where(Contribution.item_id == item_id)
    )
    total = float(total_result.scalar())
    if item.target_amount and total >= float(item.target_amount):
        item.status = "collected"
    elif item.is_group_gift and item.status != "collecting":
        item.status = "collecting"

    await db.commit()
    await db.refresh(contribution)
    return ContributionResponse(id=contribution.id, contributor_token=token, amount=float(contribution.amount), note=contribution.note)


@router.delete("/contributions/{contribution_id}", status_code=204)
async def delete_contribution(contribution_id: str, body: DeleteContributionRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Contribution).where(
            Contribution.id == contribution_id,
            Contribution.contributor_token == body.contributor_token,
        )
    )
    contribution = result.scalar_one_or_none()
    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found or invalid token")

    item_id = contribution.item_id
    await db.delete(contribution)
    await db.flush()

    # Recalculate item status
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if item and item.status == "collected":
        total_result = await db.execute(
            select(func.coalesce(func.sum(Contribution.amount), 0)).where(Contribution.item_id == item_id)
        )
        total = float(total_result.scalar())
        if not item.target_amount or total < float(item.target_amount):
            item.status = "collecting"

    await db.commit()
