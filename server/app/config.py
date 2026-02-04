from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database: set DATABASE_URL for PostgreSQL (e.g. Neon), or leave empty for SQLite
    DATABASE_URL: str = ""

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS: comma-separated origins (e.g. https://your-app.vercel.app,https://your-app.onrender.com)
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Amount per match (Rs) - can differ for semi and final
    BID_AMOUNT_LEAGUE: int = 50
    BID_AMOUNT_SEMI: int = 100
    BID_AMOUNT_FINAL: int = 200

    # Bid limits per stage
    BID_LIMIT_LEAGUE: int = 30
    BID_LIMIT_SEMI: int = 2
    BID_LIMIT_FINAL: int = 1

    # Admin usernames (comma-separated in env, or default "admin")
    ADMIN_USERNAMES: str = "admin"

    @property
    def admin_usernames_list(self) -> list[str]:
        return [u.strip().lower() for u in self.ADMIN_USERNAMES.split(",") if u.strip()]

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = (
            ".env.local"
            if (__import__("pathlib").Path(__file__).resolve().parent.parent / ".env.local").exists()
            else ".env"
        )


settings = Settings()
