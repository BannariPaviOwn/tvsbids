from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Bid limits per stage
    BID_LIMIT_LEAGUE: int = 30
    BID_LIMIT_SEMI: int = 2
    BID_LIMIT_FINAL: int = 1

    class Config:
        env_file = ".env"


settings = Settings()
