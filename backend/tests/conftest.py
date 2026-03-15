import os

# Must be set before any app imports so pydantic-settings loads them
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-testing-only")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.core.database import Base, get_db

_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestSession = async_sessionmaker(_engine, expire_on_commit=False)


async def _override_get_db():
    async with _TestSession() as session:
        yield session


app.dependency_overrides[get_db] = _override_get_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _create_tables():
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def user_data():
    """Return unique user credentials for each test."""
    uid = uuid.uuid4().hex[:8]
    return {"email": f"user_{uid}@example.com", "password": "pass1234", "name": f"User {uid}"}


@pytest_asyncio.fixture
async def auth_headers(client, user_data):
    resp = await client.post("/auth/register", json=user_data)
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def wishlist(client, auth_headers):
    resp = await client.post("/wishlists", json={"title": "My Wishlist"}, headers=auth_headers)
    assert resp.status_code == 201
    return resp.json()


@pytest_asyncio.fixture
async def item(client, auth_headers, wishlist):
    resp = await client.post(
        f"/wishlists/{wishlist['id']}/items",
        json={"title": "Test Item", "price": 100.0},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    return resp.json()
