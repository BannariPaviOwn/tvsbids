"""Seed users and teams only. Matches come from app.match_data (no DB storage)."""
import os
import sys

# Support --local to use SQLite (must run BEFORE importing app.database)
if "--local" in sys.argv:
    os.environ["DATABASE_URL"] = ""

from app.database import SessionLocal, engine
from app.models import Base, Team, User
from app.auth import get_password_hash

# With --local, drop and recreate for a fresh schema (e.g. after model changes)
if "--local" in sys.argv:
    Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Leaderboard players (default password: bid123, unique mobile per user)
LEADERBOARD_USERS = ["pavi", "simbu", "sax", "ks", "nimie", "nikhil", "ranjith"]
for i, uname in enumerate(LEADERBOARD_USERS):
    if not db.query(User).filter(User.username == uname).first():
        mobile = f"98765432{10 + i:02d}"  # 9876543210, 9876543211, ...
        db.add(User(username=uname, hashed_password=get_password_hash("bid123"), mobile_number=mobile))
db.commit()

# Teams - must match app.match_data.TEAMS_DATA (id, name, short_name) for bid validation
from app.match_data import TEAMS_DATA as MD_TEAMS

TEAMS_DATA = [{"id": t[0], "name": t[1], "short_name": t[2]} for t in MD_TEAMS]

for t in TEAMS_DATA:
    if not db.query(Team).filter(Team.short_name == t["short_name"]).first():
        db.add(Team(**t))

db.commit()
db.close()
print("Seed data created successfully (users + teams). Matches from match_data.py.")
