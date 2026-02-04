from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Bid
from ..schemas import BidCreate, BidResponse
from ..auth import get_current_user
from ..config import settings
from ..match_data import get_match_by_id, get_match_type, get_match_team_ids

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
    return sum(1 for b in bids if get_match_type(b.match_id) == match_type)


@router.post("/", response_model=BidResponse)
def place_bid(
    bid_data: BidCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> BidResponse:
    match = get_match_by_id(bid_data.match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match["is_locked"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Match has started. Bidding is closed."
        )

    team_ids = get_match_team_ids(bid_data.match_id)
    if not team_ids or bid_data.selected_team_id not in team_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team selection"
        )

    # Check if user already bid on this match
    existing = db.query(Bid).filter(
        Bid.user_id == current_user.id,
        Bid.match_id == bid_data.match_id
    ).first()

    # If a bid already exists and the match is still open, allow changing the team
    if existing:
        existing.selected_team_id = bid_data.selected_team_id
        existing.bid_status = "placed"
        db.commit()
        db.refresh(existing)
        return BidResponse.model_validate(existing)

    # New bid: enforce per-stage bid limits
    mtype = get_match_type(bid_data.match_id)
    used = _get_user_bid_count_for_type(db, current_user.id, mtype)
    limit = _get_bid_limit(mtype)
    if used >= limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have reached the bid limit ({limit}) for {match['match_type']} matches"
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
