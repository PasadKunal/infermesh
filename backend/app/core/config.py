from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    GEMINI_API_KEY: str
    SECRET_KEY: str = "infermesh-secret-change-in-production"
    ENCRYPTION_KEY: str = ""
    ENVIRONMENT: str = "development"
    RESEND_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    GMAIL_USER: str = ""
    GMAIL_APP_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
