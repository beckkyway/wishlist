from fastapi import APIRouter
from pydantic import BaseModel

from app.services.og_parser_service import parse_url

router = APIRouter(prefix="/parse", tags=["parse"])


class ParseRequest(BaseModel):
    url: str


class ParseResponse(BaseModel):
    title: str | None = None
    image_url: str | None = None
    price: float | None = None
    description: str | None = None


@router.post("/url", response_model=ParseResponse)
async def parse_url_endpoint(body: ParseRequest):
    result = await parse_url(body.url)
    return ParseResponse(**result)
