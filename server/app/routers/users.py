from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Bid, MatchResult
from ..match_data import get_match_type, get_match_by_id, get_match_team_ids
from ..schemas import UserResponse, UserBidStats, UserDashboardStats, LeaderboardEntry, UserListEntry, UserDeactivate, MatchSetResult
from ..auth import get_current_user
from ..config import settings


def _get_bid_amount(match_type: str) -> int:
    if match_type == "semi":
        return getattr(settings, 'BID_AMOUNT_SEMI', 100)
    if match_type == "final":
        return getattr(settings, 'BID_AMOUNT_FINAL', 200)
    return getattr(settings, 'BID_AMOUNT_LEAGUE', 50)

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
    """Leaderboard: users ranked by net amount (Rs). Amount: green if positive, red if negative."""
    users = db.query(User).filter(User.is_active == 1).all()
    rows = []
    for u in users:
        bids = db.query(Bid).filter(Bid.user_id == u.id).all()
        wins = sum(1 for b in bids if b.bid_status == "won")
        losses = sum(1 for b in bids if b.bid_status == "lost")
        total = len(bids)
        amount_won = sum(b.amount_won or 0 for b in bids)
        rows.append({"user": u, "wins": wins, "losses": losses, "total": total, "amount_won": amount_won})
    rows.sort(key=lambda x: (-x["amount_won"], -x["wins"]))
    return [
        LeaderboardEntry(
            rank=i + 1,
            username=r["user"].username,
            wins=r["wins"],
            losses=r["losses"],
            total=r["total"],
            amount_won=r["amount_won"],
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


@router.get("/admin/match-results")
def admin_get_match_results(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get match results status for admin. Returns matches with result status and bid amounts."""
    if current_user.username.lower() not in settings.admin_usernames_list:
        raise HTTPException(status_code=403, detail="Admin access required")
    results = {r.match_id: r.winner_team_id for r in db.query(MatchResult).all()}
    return {
        "results": results,
        "bid_amounts": {
            "league": _get_bid_amount("league"),
            "semi": _get_bid_amount("semi"),
            "final": _get_bid_amount("final"),
        },
    }


@router.post("/admin/match-results/{match_id}/confirm")
def admin_confirm_match_result(
    match_id: int,
    data: MatchSetResult,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin confirms match result. winner_team_id=None means rain/no result (no deduction)."""
    if current_user.username.lower() not in settings.admin_usernames_list:
        raise HTTPException(status_code=403, detail="Admin access required")
    match = get_match_by_id(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    # Check already confirmed
    existing = db.query(MatchResult).filter(MatchResult.match_id == match_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Match result already confirmed")
    team1_id, team2_id = match["team1"]["id"], match["team2"]["id"]
    winner_team_id = data.winner_team_id
    if winner_team_id is not None and winner_team_id not in (team1_id, team2_id):
        raise HTTPException(status_code=400, detail="Winner must be one of the playing teams")
    bids = db.query(Bid).filter(Bid.match_id == match_id, Bid.selected_team_id.isnot(None)).all()
    match_type = match.get("match_type", "league")
    bid_amount = _get_bid_amount(match_type)
    if winner_team_id is None:
        # Rain dispute: no amount deducted
        for b in bids:
            b.bid_status = "no_result"
            b.amount_won = 0
    else:
        winners = [b for b in bids if b.selected_team_id == winner_team_id]
        losers = [b for b in bids if b.selected_team_id != winner_team_id]
        pot = len(losers) * bid_amount
        for b in losers:
            b.bid_status = "lost"
            b.amount_won = -bid_amount
        if winners:
            share = pot // len(winners)
            for b in winners:
                b.bid_status = "won"
                b.amount_won = share - bid_amount  # Net profit
        else:
            # No winners: losers get refund? Or pot goes to... For now, losers still lose.
            pass
    db.add(MatchResult(match_id=match_id, winner_team_id=winner_team_id))
    db.commit()
    return {"ok": True, "match_id": match_id, "winner_team_id": winner_team_id}


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
