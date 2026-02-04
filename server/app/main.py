from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import engine, Base, get_db, is_postgres
from .models import User, Team, Bid, MatchResult
from .routers import auth, matches, bids, users
from .config import settings

# Create tables
Base.metadata.create_all(bind=engine)

# Migration: add winner_team_id if not exists (SQLite)
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE matches ADD COLUMN winner_team_id INTEGER"))
except Exception:
    pass  # Column may already exist

# Migration: add venue if not exists (SQLite)
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE matches ADD COLUMN venue VARCHAR(100)"))
except Exception:
    pass  # Column may already exist

# Migration: add series if not exists (SQLite)
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE matches ADD COLUMN series VARCHAR(30) DEFAULT 'worldcup'"))
except Exception:
    pass  # Column may already exist

# Migration: drop bids.match_id FK for PostgreSQL (matches now from match_data)
if is_postgres:
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_match_id_fkey"))
    except Exception:
        pass

# Migration: add amount_won to bids
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE bids ADD COLUMN amount_won INTEGER"))
except Exception:
    pass

# Migration: add mobile_number, is_active to users
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN mobile_number VARCHAR(15)"))
except Exception:
    pass
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1"))
except Exception:
    pass

app = FastAPI(
    title="TVS-Bids",
    description="Bid on cricket match outcomes",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(matches.router, prefix="/matches", tags=["matches"])
app.include_router(bids.router, prefix="/bids", tags=["bids"])
app.include_router(users.router, prefix="/users", tags=["users"])


@app.get("/")
def root():
    return {"message": "TVS-Bids API", "docs": "/docs"}
