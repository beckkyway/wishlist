import json
import re

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["ai"])

SYSTEM_PROMPT = """Ты — помощник по подбору подарков. Твоя задача — предложить 6 конкретных идей подарков на основе ответов пользователя.

Верни ТОЛЬКО валидный JSON в следующем формате (без markdown, без пояснений):
{
  "ideas": [
    {
      "emoji": "🎧",
      "title": "Беспроводные наушники",
      "description": "Качественный звук в дороге и дома. Подойдут для музыки, подкастов и звонков.",
      "price_hint": "3 000 – 8 000 ₽"
    }
  ]
}

Правила:
- Ровно 6 идей
- Разнообразные, конкретные (не абстрактные)
- Цены реалистичные и соответствуют бюджету
- Описание 1–2 предложения, живое и дружелюбное
- emoji уникальный для каждой идеи
"""


class SuggestRequest(BaseModel):
    occasion: str = ""
    budget: str = ""
    interests: list[str] = []
    for_whom: str = ""
    extra: str = ""


class GiftIdea(BaseModel):
    emoji: str
    title: str
    description: str
    price_hint: str


class SuggestResponse(BaseModel):
    ideas: list[GiftIdea]


def _build_prompt(body: SuggestRequest) -> str:
    parts = []
    if body.occasion:
        parts.append(f"Повод: {body.occasion}")
    if body.budget:
        parts.append(f"Бюджет: {body.budget}")
    if body.interests:
        parts.append(f"Интересы: {', '.join(body.interests)}")
    if body.for_whom:
        parts.append(f"Для кого: {body.for_whom}")
    if body.extra:
        parts.append(f"Дополнительно: {body.extra}")
    return "\n".join(parts) if parts else "Универсальный подарок, любой бюджет"


def _parse_ideas(content: str) -> list[GiftIdea]:
    # Strip markdown code fences if present
    content = re.sub(r"```(?:json)?", "", content).strip()
    try:
        data = json.loads(content)
        return [GiftIdea(**item) for item in data.get("ideas", [])]
    except Exception:
        raise HTTPException(status_code=502, detail="AI вернул некорректный ответ, попробуйте ещё раз")


@router.post("/suggest", response_model=SuggestResponse)
async def suggest_gifts(body: SuggestRequest):
    if not settings.OPENROUTER_API_KEY:
        raise HTTPException(status_code=503, detail="AI не настроен")

    prompt = _build_prompt(body)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://wishlist.app",
                    "X-Title": "Wishlist Gift Advisor",
                },
                json={
                    "model": "anthropic/claude-3-haiku",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.85,
                    "max_tokens": 1200,
                },
                timeout=30.0,
            )
            response.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI не ответил вовремя, попробуйте ещё раз")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Ошибка AI: {e.response.status_code}")

    content = response.json()["choices"][0]["message"]["content"]
    ideas = _parse_ideas(content)
    return SuggestResponse(ideas=ideas)
