from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Bid, Match
from ..schemas import BidCreate, BidResponse, UserBidStats
from ..auth import get_current_user
from ..config import settings
from ..routers.matches import _is_match_locked

router = APIRouter()


def _get_bid_limit(match_type: str) -> int:
    if match_type == "league":
        return settings.BID_LIMIT_LEAGUE
    if match_type == "semi":
        return settings.BID_LIMIT_SEMI
    if match_type == "final":
        return settings.BID_LIMIT_FINAL
    return 0


def _get_user_bid_count_for_type(db: Session, user_id: int, match_type: str) -> int:
    bids = db.query(Bid).filter(Bid.user_id == user_id).all()
    match_ids = [b.match_id for b in bids]
    if not match_ids:
        return 0
    matches = db.query(Match).filter(Match.id.in_(match_ids), Match.match_type == match_type).all()
    return len(matches)


@router.post("/", response_model=BidResponse)
def place_bid(
    bid_data: BidCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == bid_data.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if _is_match_locked(match):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Match has started. Bidding is closed."
        )

    if bid_data.selected_team_id not in [match.team1_id, match.team2_id]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team selection"
        )

    # Check if user already bid on this match
    existing = db.query(Bid).filter(
        Bid.user_id == current_user.id,
        Bid.match_id == bid_data.match_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already placed a bid on this match"
        )

    # Check bid limit for match type
    used = _get_user_bid_count_for_type(db, current_user.id, match.match_type)
    limit = _get_bid_limit(match.match_type)
    if used >= limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have reached the bid limit ({limit}) for {match.match_type} matches"
        )

    bid = Bid(
        user_id=current_user.id,
        match_id=bid_data.match_id,
        selected_team_id=bid_data.selected_team_id,
        bid_status="placed"
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)
    return BidResponse.model_validate(bid)


@router.get("/my", response_model=list[BidResponse])
def my_bids(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bids = db.query(Bid).filter(Bid.user_id == current_user.id).order_by(Bid.created_at.desc()).all()
    return [BidResponse.model_validate(b) for b in bids]


@router.get("/for-match/{match_id}")
def get_my_bid_for_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bid = db.query(Bid).filter(
        Bid.user_id == current_user.id,
        Bid.match_id == match_id
    ).first()
    if not bid:
        return {"has_bid": False, "bid": None}
    return {"has_bid": True, "bid": BidResponse.model_validate(bid)}
