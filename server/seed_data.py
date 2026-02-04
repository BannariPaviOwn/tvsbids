"""Seed teams, sample matches, and leaderboard players.
Run: python -m seed_data
For local SQLite (when Neon unreachable): python -m seed_data --local
"""
import os
import sys

# Support --local to use SQLite (must run BEFORE importing app.database)
if "--local" in sys.argv:
    os.environ["DATABASE_URL"] = ""

from app.database import SessionLocal, engine
from app.models import Base, Team, Match, User
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

# Teams - World Cup participants (India & Sri Lanka hosts)
teams_data = [
    {"name": "India", "short_name": "IND"},
    {"name": "Pakistan", "short_name": "PAK"},
    {"name": "Sri Lanka", "short_name": "SL"},
    {"name": "Scotland", "short_name": "SCO"},
    {"name": "Afghanistan", "short_name": "AFG"},
    {"name": "UAE", "short_name": "UAE"},
    {"name": "Oman", "short_name": "OMA"},
    {"name": "West Indies", "short_name": "WI"},
    {"name": "USA", "short_name": "USA"},
    {"name": "Canada", "short_name": "CAN"},
    {"name": "Australia", "short_name": "AUS"},
    {"name": "New Zealand", "short_name": "NZ"},
    {"name": "South Africa", "short_name": "SA"},
    {"name": "Namibia", "short_name": "NAM"},
    {"name": "Zimbabwe", "short_name": "ZIM"},
    {"name": "Ireland", "short_name": "IRE"},
    {"name": "England", "short_name": "ENG"},
    {"name": "Netherlands", "short_name": "NED"},
    {"name": "Italy", "short_name": "ITA"},
    {"name": "Nepal", "short_name": "NEP"},
]

for t in teams_data:
    if not db.query(Team).filter(Team.short_name == t["short_name"]).first():
        db.add(Team(**t))

db.commit()

# World Cup 2026 - League stage (exact schedule from user)
teams = {t.short_name: t for t in db.query(Team).all()}

# (t1, t2, mtype, match_date, match_time, venue, series)
worldcup_matches = [
    ("PAK", "NED", "league", "2026-02-07", "11:00", "SSC, Colombo", "worldcup"),
    ("WI", "SCO", "league", "2026-02-07", "15:00", "Kolkata", "worldcup"),
    ("IND", "USA", "league", "2026-02-07", "19:00", "Mumbai", "worldcup"),
    ("NZ", "AFG", "league", "2026-02-08", "11:00", "Chennai", "worldcup"),
    ("ENG", "NEP", "league", "2026-02-08", "15:00", "Mumbai", "worldcup"),
    ("SL", "IRE", "league", "2026-02-08", "19:00", "Premadasa, Colombo", "worldcup"),
    ("SCO", "ITA", "league", "2026-02-09", "11:00", "Kolkata", "worldcup"),
    ("ZIM", "OMA", "league", "2026-02-09", "15:00", "SSC, Colombo", "worldcup"),
    ("SA", "CAN", "league", "2026-02-09", "19:00", "Ahmedabad", "worldcup"),
    ("NED", "NAM", "league", "2026-02-10", "11:00", "Delhi", "worldcup"),
    ("NZ", "UAE", "league", "2026-02-10", "15:00", "Chennai", "worldcup"),
    ("PAK", "USA", "league", "2026-02-10", "19:00", "SSC, Colombo", "worldcup"),
    ("SA", "AFG", "league", "2026-02-11", "11:00", "Ahmedabad", "worldcup"),
    ("AUS", "IRE", "league", "2026-02-11", "15:00", "Premadasa, Colombo", "worldcup"),
    ("ENG", "WI", "league", "2026-02-11", "19:00", "Mumbai", "worldcup"),
    ("SL", "OMA", "league", "2026-02-12", "11:00", "Kandy", "worldcup"),
    ("NEP", "ITA", "league", "2026-02-12", "15:00", "Mumbai", "worldcup"),
    ("IND", "NAM", "league", "2026-02-12", "19:00", "New Delhi", "worldcup"),
    ("AUS", "ZIM", "league", "2026-02-13", "11:00", "Premadasa, Colombo", "worldcup"),
    ("CAN", "UAE", "league", "2026-02-13", "15:00", "Delhi", "worldcup"),
    ("USA", "NED", "league", "2026-02-13", "19:00", "Chennai", "worldcup"),
    ("IRE", "OMA", "league", "2026-02-14", "11:00", "SSC, Colombo", "worldcup"),
    ("ENG", "SCO", "league", "2026-02-14", "15:00", "Kolkata", "worldcup"),
    ("NZ", "SA", "league", "2026-02-14", "19:00", "Ahmedabad", "worldcup"),
    ("WI", "NEP", "league", "2026-02-15", "11:00", "Mumbai", "worldcup"),
    ("USA", "NAM", "league", "2026-02-15", "15:00", "Chennai", "worldcup"),
    ("IND", "PAK", "league", "2026-02-15", "19:00", "Premadasa, Colombo", "worldcup"),
    ("AFG", "UAE", "league", "2026-02-16", "11:00", "Delhi", "worldcup"),
    ("ENG", "ITA", "league", "2026-02-16", "15:00", "Kolkata", "worldcup"),
    ("AUS", "SL", "league", "2026-02-16", "19:00", "Kandy", "worldcup"),
    ("NZ", "CAN", "league", "2026-02-17", "11:00", "Chennai", "worldcup"),
    ("IRE", "ZIM", "league", "2026-02-17", "15:00", "Kandy", "worldcup"),
    ("SCO", "NEP", "league", "2026-02-17", "19:00", "Mumbai", "worldcup"),
    ("SA", "UAE", "league", "2026-02-18", "11:00", "Delhi", "worldcup"),
    ("PAK", "NAM", "league", "2026-02-18", "15:00", "SSC, Colombo", "worldcup"),
    ("IND", "NED", "league", "2026-02-18", "19:00", "Ahmedabad", "worldcup"),
    ("WI", "ITA", "league", "2026-02-19", "11:00", "Kolkata", "worldcup"),
    ("SL", "ZIM", "league", "2026-02-19", "15:00", "Premadasa, Colombo", "worldcup"),
    ("AFG", "CAN", "league", "2026-02-19", "19:00", "Chennai", "worldcup"),
    ("AUS", "OMA", "league", "2026-02-20", "19:00", "Kandy", "worldcup"),
]

for t1_short, t2_short, mtype, match_date, match_time, venue, series in worldcup_matches:
    t1 = teams.get(t1_short)
    t2 = teams.get(t2_short)
    if t1 and t2:
        if not db.query(Match).filter(
            Match.team1_id == t1.id, Match.team2_id == t2.id,
            Match.match_date == match_date, Match.match_time == match_time,
            Match.series == series
        ).first():
            db.add(Match(
                team1_id=t1.id, team2_id=t2.id,
                match_date=match_date, match_time=match_time,
                venue=venue, match_type=mtype, series=series
            ))

db.commit()
db.close()
print("Seed data created successfully.")
