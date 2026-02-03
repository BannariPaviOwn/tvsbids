"""Seed teams, sample matches, and leaderboard players. Run: python -m seed_data"""
from datetime import datetime, timedelta
from app.database import SessionLocal, engine
from app.models import Base, Team, Match, User
from app.auth import get_password_hash

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Leaderboard players (default password: bid123)
LEADERBOARD_USERS = ["pavi", "simbu", "sax", "ks", "nimie", "nikhil", "ranjith"]
for uname in LEADERBOARD_USERS:
    if not db.query(User).filter(User.username == uname).first():
        db.add(User(username=uname, hashed_password=get_password_hash("bid123")))
db.commit()

# Teams
teams_data = [
    {"name": "India", "short_name": "IND"},
    {"name": "Australia", "short_name": "AUS"},
    {"name": "England", "short_name": "ENG"},
    {"name": "Pakistan", "short_name": "PAK"},
    {"name": "South Africa", "short_name": "SA"},
    {"name": "New Zealand", "short_name": "NZ"},
    {"name": "West Indies", "short_name": "WI"},
    {"name": "Sri Lanka", "short_name": "SL"},
    {"name": "Bangladesh", "short_name": "BAN"},
    {"name": "Afghanistan", "short_name": "AFG"},
]

for t in teams_data:
    if not db.query(Team).filter(Team.short_name == t["short_name"]).first():
        db.add(Team(**t))

db.commit()

# Sample matches - IND vs AUS, Afghanistan vs New Zealand, etc.
today = datetime.now().date()
teams = {t.short_name: t for t in db.query(Team).all()}

sample_matches = [
    ("IND", "AUS", "league", 0, "14:00", "Wankhede Stadium, Mumbai"),
    ("AFG", "NZ", "league", 0, "15:30", "Eden Gardens, Kolkata"),
    ("ENG", "PAK", "league", 1, "19:00", "Chinnaswamy Stadium, Bengaluru"),
    ("SA", "WI", "league", 1, "14:00", "MA Chidambaram Stadium, Chennai"),
    ("SL", "BAN", "league", 2, "15:30", "Arun Jaitley Stadium, Delhi"),
    ("IND", "ENG", "league", 2, "19:00", "Narendra Modi Stadium, Ahmedabad"),
    ("AUS", "AFG", "league", 3, "14:00", "Wankhede Stadium, Mumbai"),
    ("NZ", "PAK", "semi", 4, "14:00", "Eden Gardens, Kolkata"),
    ("IND", "SA", "semi", 5, "19:00", "Wankhede Stadium, Mumbai"),
    ("SA", "IND", "final", 6, "19:00", "Narendra Modi Stadium, Ahmedabad"),
]

for t1_short, t2_short, mtype, day_offset, match_time, venue in sample_matches:
    t1 = teams.get(t1_short)
    t2 = teams.get(t2_short)
    if t1 and t2:
        d = (today + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        if not db.query(Match).filter(
            Match.team1_id == t1.id, Match.team2_id == t2.id,
            Match.match_date == d, Match.match_time == match_time
        ).first():
            db.add(Match(
                team1_id=t1.id, team2_id=t2.id,
                match_date=d, match_time=match_time,
                venue=venue, match_type=mtype
            ))

db.commit()
db.close()
print("Seed data created successfully.")
