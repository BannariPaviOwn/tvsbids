"""Static match data - served directly, no database storage."""
from datetime import datetime

# Teams: (id, name, short_name) - ids must match seed_data teams for bid validation
TEAMS_DATA = [
    (1, "India", "IND"),
    (2, "Pakistan", "PAK"),
    (3, "Sri Lanka", "SL"),
    (4, "Scotland", "SCO"),
    (5, "Afghanistan", "AFG"),
    (6, "UAE", "UAE"),
    (7, "Oman", "OMA"),
    (8, "West Indies", "WI"),
    (9, "USA", "USA"),
    (10, "Canada", "CAN"),
    (11, "Australia", "AUS"),
    (12, "New Zealand", "NZ"),
    (13, "South Africa", "SA"),
    (14, "Namibia", "NAM"),
    (15, "Zimbabwe", "ZIM"),
    (16, "Ireland", "IRE"),
    (17, "England", "ENG"),
    (18, "Netherlands", "NED"),
    (19, "Italy", "ITA"),
    (20, "Nepal", "NEP"),
]

# (t1_short, t2_short, mtype, match_date, match_time, venue, series)
WORLDCUP_MATCHES = [
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

TEAMS_BY_SHORT = {t[2]: {"id": t[0], "name": t[1], "short_name": t[2]} for t in TEAMS_DATA}


def _is_match_locked(match_date: str, match_time: str) -> bool:
    try:
        match_dt = datetime.strptime(f"{match_date} {match_time}", "%Y-%m-%d %H:%M")
        return datetime.now() >= match_dt
    except ValueError:
        return False


def _seconds_until_start(match_date: str, match_time: str) -> int | None:
    try:
        match_dt = datetime.strptime(f"{match_date} {match_time}", "%Y-%m-%d %H:%M")
        delta = (match_dt - datetime.now()).total_seconds()
        return max(0, int(delta)) if delta > 0 else None
    except ValueError:
        return None


def get_matches(series: str | None = None) -> list[dict]:
    """Return matches as MatchResponse format (no DB)."""
    result = []
    for i, (t1_short, t2_short, mtype, match_date, match_time, venue, s) in enumerate(WORLDCUP_MATCHES):
        if series and s != series:
            continue
        t1 = TEAMS_BY_SHORT.get(t1_short)
        t2 = TEAMS_BY_SHORT.get(t2_short)
        if not t1 or not t2:
            continue
        t1_resp = {"id": t1["id"], "name": t1["name"], "short_name": t1["short_name"]}
        t2_resp = {"id": t2["id"], "name": t2["name"], "short_name": t2["short_name"]}
        is_locked = _is_match_locked(match_date, match_time)
        secs = _seconds_until_start(match_date, match_time)
        result.append({
            "id": i + 1,
            "team1": t1_resp,
            "team2": t2_resp,
            "match_date": match_date,
            "match_time": match_time,
            "venue": venue,
            "match_type": mtype,
            "series": s,
            "status": "upcoming",
            "winner_team_id": None,
            "is_locked": is_locked,
            "seconds_until_start": secs,
        })
    return result


def get_match_by_id(match_id: int) -> dict | None:
    """Get match by id (1-based)."""
    if match_id < 1 or match_id > len(WORLDCUP_MATCHES):
        return None
    t1_short, t2_short, mtype, match_date, match_time, venue, s = WORLDCUP_MATCHES[match_id - 1]
    t1 = TEAMS_BY_SHORT.get(t1_short)
    t2 = TEAMS_BY_SHORT.get(t2_short)
    if not t1 or not t2:
        return None
    is_locked = _is_match_locked(match_date, match_time)
    secs = _seconds_until_start(match_date, match_time)
    return {
        "id": match_id,
        "team1": {"id": t1["id"], "name": t1["name"], "short_name": t1["short_name"]},
        "team2": {"id": t2["id"], "name": t2["name"], "short_name": t2["short_name"]},
        "match_date": match_date,
        "match_time": match_time,
        "venue": venue,
        "match_type": mtype,
        "series": s,
        "status": "upcoming",
        "winner_team_id": None,
        "is_locked": is_locked,
        "seconds_until_start": secs,
    }


def get_match_type(match_id: int) -> str | None:
    """Get match_type for a match_id (for bid limits)."""
    if match_id < 1 or match_id > len(WORLDCUP_MATCHES):
        return None
    return WORLDCUP_MATCHES[match_id - 1][2]


def get_match_team_ids(match_id: int) -> tuple[int, int] | None:
    """Get (team1_id, team2_id) for a match_id."""
    m = get_match_by_id(match_id)
    if not m:
        return None
    return (m["team1"]["id"], m["team2"]["id"])
