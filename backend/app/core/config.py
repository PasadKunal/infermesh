from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    GEMINI_API_KEY: str
    DEFAULT_API_KEY: str = "infermesh-dev-key-123"
    SECRET_KEY: str = "infermesh-secret-change-in-production"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
