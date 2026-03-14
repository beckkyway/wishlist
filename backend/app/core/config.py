from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 30

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    CORS_ORIGINS: str = "http://localhost:3000"

    OPENROUTER_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
