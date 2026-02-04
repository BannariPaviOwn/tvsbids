from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Bid
from ..match_data import get_match_type
from ..schemas import UserResponse, UserBidStats, UserDashboardStats, LeaderboardEntry, UserListEntry, UserDeactivate
from ..auth import get_current_user
from ..config import settings

router = APIRouter()


def _user_response(user: User) -> UserResponse:
    return UserResponse.model_validate(user).model_copy(
        update={"is_admin": user.username.lower() in settings.admin_usernames_list}
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return _user_response(current_user)


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
    league_used = sum(1 for b in bids if get_match_type(b.match_id) == "league")
    semi_used = sum(1 for b in bids if get_match_type(b.match_id) == "semi")
    final_used = sum(1 for b in bids if get_match_type(b.match_id) == "final")

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


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """Leaderboard: all users ranked by wins (most wins at top)."""
    users = db.query(User).all()
    rows = []
    for u in users:
        bids = db.query(Bid).filter(Bid.user_id == u.id).all()
        wins = sum(1 for b in bids if b.bid_status == "won")
        losses = sum(1 for b in bids if b.bid_status == "lost")
        total = len(bids)
        rows.append({"user": u, "wins": wins, "losses": losses, "total": total})
    rows.sort(key=lambda x: (-x["wins"], -x["total"]))
    return [
        LeaderboardEntry(
            rank=i + 1,
            username=r["user"].username,
            wins=r["wins"],
            losses=r["losses"],
            total=r["total"],
        )
        for i, r in enumerate(rows)
    ]


@router.get("/admin/users", response_model=list[UserListEntry])
def admin_list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users. Admin only."""
    if current_user.username.lower() not in settings.admin_usernames_list:
        raise HTTPException(status_code=403, detail="Admin access required")
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        UserListEntry(
            id=u.id,
            username=u.username,
            mobile_number=getattr(u, "mobile_number", None),
            is_active=bool(getattr(u, "is_active", 1)),
            created_at=u.created_at,
        )
        for u in users
    ]


@router.patch("/admin/users/{user_id}")
def admin_set_user_active(
    user_id: int,
    data: UserDeactivate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deactivate or activate a user. Admin only."""
    if current_user.username.lower() not in settings.admin_usernames_list:
        raise HTTPException(status_code=403, detail="Admin access required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = 1 if data.is_active else 0
    db.commit()
    return {"ok": True, "is_active": user.is_active}
