"""Seed teams and sample matches. Run: python -m seed_data"""
from datetime import datetime, timedelta
from app.database import SessionLocal, engine
from app.models import Base, Team, Match

Base.metadata.create_all(bind=engine)
db = SessionLocal()

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

# Sample matches for next 7 days
today = datetime.now().date()
teams = db.query(Team).all()
if len(teams) >= 4:
    sample_matches = [
        (teams[0].id, teams[1].id, "league"),
        (teams[2].id, teams[3].id, "league"),
        (teams[4].id, teams[5].id, "league"),
        (teams[6].id, teams[7].id, "league"),
    ]
    for i, (t1, t2, mtype) in enumerate(sample_matches):
        d = (today + timedelta(days=i % 3)).strftime("%Y-%m-%d")
        t = f"{(14 + i) % 24:02d}:00"
        if not db.query(Match).filter(
            Match.team1_id == t1, Match.team2_id == t2,
            Match.match_date == d, Match.match_time == t
        ).first():
            db.add(Match(
                team1_id=t1, team2_id=t2,
                match_date=d, match_time=t,
                match_type=mtype
            ))

db.commit()
db.close()
print("Seed data created successfully.")
