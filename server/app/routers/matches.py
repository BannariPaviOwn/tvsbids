from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Match, Team
from ..schemas import MatchResponse, MatchCreate, TeamResponse
from ..auth import get_current_user

router = APIRouter()


def _is_match_locked(match: Match) -> bool:
    """Match is locked (bidding disabled) when match time has passed."""
    try:
        match_dt = datetime.strptime(f"{match.match_date} {match.match_time}", "%Y-%m-%d %H:%M")
        return datetime.now() >= match_dt
    except ValueError:
        return False


def _seconds_until_start(match: Match) -> int | None:
    try:
        match_dt = datetime.strptime(f"{match.match_date} {match.match_time}", "%Y-%m-%d %H:%M")
        delta = (match_dt - datetime.now()).total_seconds()
        return max(0, int(delta)) if delta > 0 else None
    except ValueError:
        return None


def _match_to_response(match: Match) -> MatchResponse:
    return MatchResponse(
        id=match.id,
        team1=TeamResponse.model_validate(match.team1),
        team2=TeamResponse.model_validate(match.team2),
        match_date=match.match_date,
        match_time=match.match_time,
        match_type=match.match_type,
        status=match.status,
        is_locked=_is_match_locked(match),
        seconds_until_start=_seconds_until_start(match)
    )


@router.get("/", response_model=list[MatchResponse])
def list_matches(
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    matches = db.query(Match).order_by(Match.match_date, Match.match_time).all()
    return [_match_to_response(m) for m in matches]


@router.get("/today", response_model=list[MatchResponse])
def list_today_matches(
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    today = datetime.now().strftime("%Y-%m-%d")
    matches = db.query(Match).filter(Match.match_date == today).order_by(Match.match_time).all()
    return [_match_to_response(m) for m in matches]


@router.get("/teams", response_model=list[TeamResponse])
def list_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()


@router.post("/", response_model=MatchResponse)
def create_match(
    match_data: MatchCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    match = Match(
        team1_id=match_data.team1_id,
        team2_id=match_data.team2_id,
        match_date=match_data.match_date,
        match_time=match_data.match_time,
        match_type=match_data.match_type,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return _match_to_response(match)
