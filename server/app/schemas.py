from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# Auth
class UserCreate(BaseModel):
    username: str
    password: str
    mobile_number: str  # Required, one account per mobile


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime
    is_admin: bool = False

    class Config:
        from_attributes = True


# Teams
class TeamResponse(BaseModel):
    id: int
    name: str
    short_name: str

    class Config:
        from_attributes = True


# Matches
class MatchResponse(BaseModel):
    id: int
    team1: TeamResponse
    team2: TeamResponse
    match_date: str
    match_time: str
    venue: Optional[str] = None
    match_type: str
    series: str = "worldcup"  # ipl, worldcup, etc.
    status: str
    winner_team_id: Optional[int] = None
    is_locked: bool = False
    seconds_until_start: Optional[int] = None

    class Config:
        from_attributes = True


class MatchCreate(BaseModel):
    team1_id: int
    team2_id: int
    match_date: str
    match_time: str
    venue: Optional[str] = None
    match_type: str  # league, semi, final
    series: str = "worldcup"  # ipl, worldcup, etc.


class MatchSetResult(BaseModel):
    winner_team_id: Optional[int] = None  # None = rain/no result


class BidderInfo(BaseModel):
    username: str
    bid_status: str  # placed, won, lost


class MatchBidBreakdown(BaseModel):
    team1_bidders: List[BidderInfo]
    team2_bidders: List[BidderInfo]
    winner_team_id: Optional[int] = None


# Bids
class BidCreate(BaseModel):
    match_id: int
    selected_team_id: int


class BidResponse(BaseModel):
    id: int
    match_id: int
    selected_team_id: Optional[int]
    bid_status: str
    created_at: datetime

    class Config:
        from_attributes = True


# User stats
class UserBidStats(BaseModel):
    league_used: int
    league_remaining: int
    league_limit: int
    semi_used: int
    semi_remaining: int
    semi_limit: int
    final_used: int
    final_remaining: int
    final_limit: int


class UserDashboardStats(BaseModel):
    total_matches: int
    wins: int
    losses: int
    pending: int  # Matches bid on but not yet completed


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    wins: int
    losses: int
    total: int
    amount_won: int = 0  # Net Rs (positive=profit, negative=loss)


# Admin
class UserListEntry(BaseModel):
    id: int
    username: str
    mobile_number: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserDeactivate(BaseModel):
    is_active: bool
