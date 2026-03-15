from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

_kw: dict = {"echo": False}
if settings.DATABASE_URL.startswith("postgresql+asyncpg"):
    # Supabase / pgbouncer transaction mode requires disabling prepared statement caches
    _kw["prepared_statement_cache_size"] = 0
    _kw["connect_args"] = {"statement_cache_size": 0}

engine = create_async_engine(settings.DATABASE_URL, **_kw)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
