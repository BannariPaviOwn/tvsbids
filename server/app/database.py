from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import settings


def _get_database_url():
    if settings.DATABASE_URL and settings.DATABASE_URL.strip():
        return settings.DATABASE_URL.strip()
    return "sqlite:///./bids.db"


SQLALCHEMY_DATABASE_URL = _get_database_url()
is_postgres = "postgresql" in SQLALCHEMY_DATABASE_URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if not is_postgres else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
