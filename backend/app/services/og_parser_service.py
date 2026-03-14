import re
from typing import Any

import httpx
from bs4 import BeautifulSoup


async def parse_url(url: str) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=5, follow_redirects=True) as client:
            headers = {"User-Agent": "Mozilla/5.0 (compatible; WishlistBot/1.0)"}
            response = await client.get(url, headers=headers)
            response.raise_for_status()
    except Exception:
        return {}

    try:
        soup = BeautifulSoup(response.text, "html.parser")
    except Exception:
        return {}

    def og(prop: str) -> str | None:
        tag = soup.find("meta", property=f"og:{prop}") or soup.find("meta", attrs={"name": f"og:{prop}"})
        return tag.get("content") if tag else None

    title = og("title") or (soup.title.string.strip() if soup.title else None)
    image_url = og("image")
    description = og("description")

    # Try to extract price
    price = None
    price_meta = soup.find("meta", property="product:price:amount") or soup.find("meta", attrs={"name": "price"})
    if price_meta:
        try:
            price = float(re.sub(r"[^\d.]", "", price_meta.get("content", "")))
        except (ValueError, TypeError):
            pass

    if not price:
        # Try schema.org JSON-LD
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                import json
                data = json.loads(script.string or "")
                if isinstance(data, dict) and "offers" in data:
                    offers = data["offers"]
                    if isinstance(offers, list):
                        offers = offers[0]
                    p = offers.get("price")
                    if p:
                        price = float(str(p).replace(",", "."))
                        break
            except Exception:
                continue

    return {
        "title": title,
        "image_url": image_url,
        "price": price,
        "description": description,
    }
