from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import auth, wishlists, items, reservations, contributions, parse, share, ai

app = FastAPI(title="Wishlist API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(wishlists.router)
app.include_router(items.router)
app.include_router(reservations.router)
app.include_router(contributions.router)
app.include_router(parse.router)
app.include_router(share.router)
app.include_router(ai.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
