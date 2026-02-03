from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# Auth
class UserCreate(BaseModel):
    username: str
    password: str


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
    match_type: str
    status: str
    is_locked: bool = False
    seconds_until_start: Optional[int] = None

    class Config:
        from_attributes = True


class MatchCreate(BaseModel):
    team1_id: int
    team2_id: int
    match_date: str
    match_time: str
    match_type: str  # league, semi, final


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
