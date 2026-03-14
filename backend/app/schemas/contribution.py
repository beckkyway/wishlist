from typing import Optional
from pydantic import BaseModel


class ContributionCreate(BaseModel):
    contributor_name: str
    amount: float
    note: Optional[str] = None
    contributor_token: Optional[str] = None


class ContributionResponse(BaseModel):
    id: str
    contributor_token: str
    amount: float
    note: Optional[str]

    model_config = {"from_attributes": True}


class ContributionSummaryResponse(BaseModel):
    total_collected: float
    count: int


class DeleteContributionRequest(BaseModel):
    contributor_token: str
