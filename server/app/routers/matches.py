from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Match, Team, Bid, User
from ..schemas import MatchResponse, MatchCreate, MatchSetResult, TeamResponse, MatchBidBreakdown, BidderInfo
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
        venue=getattr(match, 'venue', None),
        match_type=match.match_type,
        series=getattr(match, 'series', None) or "worldcup",
        status=match.status,
        winner_team_id=getattr(match, 'winner_team_id', None),
        is_locked=_is_match_locked(match),
        seconds_until_start=_seconds_until_start(match)
    )


@router.get("/", response_model=list[MatchResponse])
def list_matches(
    series: str | None = Query(None, description="Filter by series: ipl, worldcup, etc."),
    db: Session = Depends(get_db),
):
    q = db.query(Match).order_by(Match.match_date, Match.match_time)
    if series:
        try:
            q = q.filter(Match.series == series)
        except Exception:
            pass  # Column may not exist in older DB
    matches = q.all()
    return [_match_to_response(m) for m in matches]


@router.get("/today", response_model=list[MatchResponse])
def list_today_matches(db: Session = Depends(get_db)):
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
        venue=match_data.venue,
        match_type=match_data.match_type,
        series=getattr(match_data, 'series', None) or "worldcup",
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return _match_to_response(match)


@router.get("/{match_id}/bid-breakdown", response_model=MatchBidBreakdown)
def get_match_bid_breakdown(
    match_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    bids = db.query(Bid).filter(Bid.match_id == match_id).all()
    users = {u.id: u for u in db.query(User).filter(User.id.in_({b.user_id for b in bids})).all()}
    team1_bidders = []
    team2_bidders = []
    for b in bids:
        if not b.selected_team_id:
            continue
        info = BidderInfo(username=users[b.user_id].username, bid_status=b.bid_status)
        if b.selected_team_id == match.team1_id:
            team1_bidders.append(info)
        else:
            team2_bidders.append(info)
    return MatchBidBreakdown(
        team1_bidders=team1_bidders,
        team2_bidders=team2_bidders,
        winner_team_id=match.winner_team_id,
    )


@router.patch("/{match_id}/result", response_model=MatchResponse)
def set_match_result(
    match_id: int,
    data: MatchSetResult,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if data.winner_team_id not in [match.team1_id, match.team2_id]:
        raise HTTPException(status_code=400, detail="Winner must be one of the playing teams")
    match.winner_team_id = data.winner_team_id
    match.status = "completed"
    # Update all bids: won or lost
    for bid in db.query(Bid).filter(Bid.match_id == match_id).all():
        if bid.selected_team_id == data.winner_team_id:
            bid.bid_status = "won"
        else:
            bid.bid_status = "lost"
    db.commit()
    db.refresh(match)
    return _match_to_response(match)
