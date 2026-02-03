from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Bid, Match
from ..schemas import UserResponse, UserBidStats, UserDashboardStats
from ..auth import get_current_user
from ..config import settings

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/dashboard-stats", response_model=UserDashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bids = db.query(Bid).filter(Bid.user_id == current_user.id).all()
    total = len(bids)
    wins = sum(1 for b in bids if b.bid_status == "won")
    losses = sum(1 for b in bids if b.bid_status == "lost")
    pending = sum(1 for b in bids if b.bid_status in ("placed", "pending"))
    return UserDashboardStats(
        total_matches=total,
        wins=wins,
        losses=losses,
        pending=pending,
    )


@router.get("/bid-stats", response_model=UserBidStats)
def get_bid_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bids = db.query(Bid).filter(Bid.user_id == current_user.id).all()
    match_ids = [b.match_id for b in bids]
    matches = db.query(Match).filter(Match.id.in_(match_ids)).all() if match_ids else []

    league_used = sum(1 for m in matches if m.match_type == "league")
    semi_used = sum(1 for m in matches if m.match_type == "semi")
    final_used = sum(1 for m in matches if m.match_type == "final")

    return UserBidStats(
        league_used=league_used,
        league_remaining=max(0, settings.BID_LIMIT_LEAGUE - league_used),
        league_limit=settings.BID_LIMIT_LEAGUE,
        semi_used=semi_used,
        semi_remaining=max(0, settings.BID_LIMIT_SEMI - semi_used),
        semi_limit=settings.BID_LIMIT_SEMI,
        final_used=final_used,
        final_remaining=max(0, settings.BID_LIMIT_FINAL - final_used),
        final_limit=settings.BID_LIMIT_FINAL,
    )
