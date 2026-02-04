"""Match operations using database. Replaces match_data for runtime match queries."""
from datetime import datetime
from sqlalchemy.orm import Session, joinedload

from .models import Match, MatchResult
from .config import settings

try:
    from zoneinfo import ZoneInfo
    _UTC = ZoneInfo("UTC")

    def _get_tz(name: str):
        try:
            return ZoneInfo(name)
        except Exception:
            return _UTC
except (ImportError, Exception):
    from datetime import timezone
    _UTC = timezone.utc
    _get_tz = lambda _: _UTC  # Fallback: use UTC for all


def _parse_match_datetime(match_date: str, match_time: str):
    """Parse match date/time as naive datetime in MATCH_TIMEZONE, return timezone-aware UTC."""
    match_dt = datetime.strptime(f"{match_date} {match_time}", "%Y-%m-%d %H:%M")
    tz = _get_tz(settings.MATCH_TIMEZONE)
    if tz:
        return match_dt.replace(tzinfo=tz).astimezone(_UTC)
    return match_dt  # Fallback: treat as UTC if zoneinfo unavailable


def _is_match_locked(match_date: str, match_time: str) -> bool:
    try:
        match_dt_utc = _parse_match_datetime(match_date, match_time)
        now_utc = datetime.now(_UTC) if _UTC else datetime.utcnow()
        return now_utc >= match_dt_utc
    except (ValueError, Exception):
        return False


def _seconds_until_start(match_date: str, match_time: str) -> int | None:
    try:
        match_dt_utc = _parse_match_datetime(match_date, match_time)
        now_utc = datetime.now(_UTC) if _UTC else datetime.utcnow()
        delta = (match_dt_utc - now_utc).total_seconds()
        return max(0, int(delta)) if delta > 0 else None
    except (ValueError, Exception):
        return None


def get_today_str() -> str:
    """Current date in MATCH_TIMEZONE (YYYY-MM-DD)."""
    tz = _get_tz(settings.MATCH_TIMEZONE) if _get_tz else None
    if tz:
        return datetime.now(tz).strftime("%Y-%m-%d")
    return datetime.utcnow().strftime("%Y-%m-%d")


def _match_to_dict(m: Match, winner_team_id: int | None = None) -> dict:
    """Convert Match ORM to MatchResponse-style dict."""
    is_locked = _is_match_locked(m.match_date, m.match_time)
    secs = _seconds_until_start(m.match_date, m.match_time)
    return {
        "id": m.id,
        "team1": {"id": m.team1.id, "name": m.team1.name, "short_name": m.team1.short_name},
        "team2": {"id": m.team2.id, "name": m.team2.name, "short_name": m.team2.short_name},
        "match_date": m.match_date,
        "match_time": m.match_time,
        "venue": m.venue or "",
        "match_type": m.match_type,
        "series": m.series or "worldcup",
        "status": m.status or "upcoming",
        "winner_team_id": winner_team_id,
        "is_locked": is_locked,
        "seconds_until_start": secs,
    }


def get_matches(db: Session, series: str | None = None) -> list[dict]:
    """Return matches from DB as MatchResponse format."""
    q = db.query(Match).options(joinedload(Match.team1), joinedload(Match.team2)).order_by(Match.match_date, Match.match_time)
    if series:
        q = q.filter(Match.series == series)
    matches = q.all()
    results = {r.match_id: r.winner_team_id for r in db.query(MatchResult).all()}
    return [_match_to_dict(m, results.get(m.id)) for m in matches]


def get_match_by_id(db: Session, match_id: int) -> dict | None:
    """Get match by id from DB."""
    m = db.query(Match).options(joinedload(Match.team1), joinedload(Match.team2)).filter(Match.id == match_id).first()
    if not m:
        return None
    result = db.query(MatchResult).filter(MatchResult.match_id == match_id).first()
    winner_team_id = result.winner_team_id if result else None
    return _match_to_dict(m, winner_team_id)


def get_match_type(db: Session, match_id: int) -> str | None:
    """Get match_type for a match_id (for bid limits)."""
    m = db.query(Match).filter(Match.id == match_id).first()
    return m.match_type if m else None


def get_match_team_ids(db: Session, match_id: int) -> tuple[int, int] | None:
    """Get (team1_id, team2_id) for a match_id."""
    m = db.query(Match).filter(Match.id == match_id).first()
    return (m.team1_id, m.team2_id) if m else None
