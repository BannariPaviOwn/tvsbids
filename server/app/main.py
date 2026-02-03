from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, get_db
from .models import User, Team, Match, Bid
from .routers import auth, matches, bids, users

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cricket Bid Browser",
    description="Bid on cricket match outcomes",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
    return {"message": "Cricket Bid Browser API", "docs": "/docs"}
