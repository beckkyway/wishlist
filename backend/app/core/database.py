from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Supabase uses pgbouncer in transaction mode — disable prepared statement caches
# at both SQLAlchemy dialect level (URL param) and asyncpg level (connect_args)
_db_url = settings.DATABASE_URL
_separator = "&" if "?" in _db_url else "?"
_db_url = f"{_db_url}{_separator}prepared_statement_cache_size=0"

engine = create_async_engine(
    _db_url,
    echo=False,
    connect_args={"statement_cache_size": 0},
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
