from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Team, Bid, User
from ..schemas import MatchResponse, TeamResponse, MatchBidBreakdown, BidderInfo
from ..auth import get_current_user
from ..match_data import get_matches, get_match_by_id

router = APIRouter()


@router.get("/", response_model=list[MatchResponse])
def list_matches(
    series: str | None = Query(None, description="Filter by series: ipl, worldcup, etc."),
):
    matches = get_matches(series)
    return [MatchResponse.model_validate(m) for m in matches]


@router.get("/today", response_model=list[MatchResponse])
def list_today_matches():
    today = datetime.now().strftime("%Y-%m-%d")
    matches = [m for m in get_matches() if m["match_date"] == today]
    return [MatchResponse.model_validate(m) for m in matches]


@router.get("/teams", response_model=list[TeamResponse])
def list_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()


@router.get("/{match_id}/bid-breakdown", response_model=MatchBidBreakdown)
def get_match_bid_breakdown(
    match_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    match = get_match_by_id(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    bids = db.query(Bid).filter(Bid.match_id == match_id).all()
    users = {u.id: u for u in db.query(User).filter(User.id.in_({b.user_id for b in bids})).all()}
    team1_id, team2_id = match["team1"]["id"], match["team2"]["id"]
    team1_bidders = []
    team2_bidders = []
    for b in bids:
        if not b.selected_team_id:
            continue
        info = BidderInfo(username=users[b.user_id].username, bid_status=b.bid_status)
        if b.selected_team_id == team1_id:
            team1_bidders.append(info)
        else:
            team2_bidders.append(info)
    return MatchBidBreakdown(
        team1_bidders=team1_bidders,
        team2_bidders=team2_bidders,
        winner_team_id=None,  # Static data - no result storage
    )
