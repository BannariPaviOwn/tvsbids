from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .database import Base


class MatchType(str, enum.Enum):
    LEAGUE = "league"
    SEMI = "semi"
    FINAL = "final"


class MatchStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    LIVE = "live"
    COMPLETED = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    mobile_number = Column(String(15), unique=True, index=True, nullable=True)  # One account per mobile
    is_active = Column(Integer, default=1, nullable=False)  # 1=active, 0=deactivated
    created_at = Column(DateTime, default=datetime.utcnow)
    # Cached stats (updated on bid place + match result confirm)
    total_bids = Column(Integer, default=0, nullable=False)
    wins = Column(Integer, default=0, nullable=False)
    losses = Column(Integer, default=0, nullable=False)
    amount_won = Column(Integer, default=0, nullable=False)  # Net Rs: +profit, -loss

    bids = relationship("Bid", back_populates="user")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    short_name = Column(String(10), nullable=False)  # e.g., IND, AUS


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    team1_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    team2_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    winner_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)  # Set when match completes
    match_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    match_time = Column(String(5), nullable=False)  # HH:MM (24h)
    venue = Column(String(100), nullable=True)  # e.g. Wankhede Stadium, Mumbai
    match_type = Column(String(20), nullable=False)  # league, semi, final
    series = Column(String(30), nullable=False, default="worldcup")  # ipl, worldcup, etc.
    status = Column(String(20), default=MatchStatus.UPCOMING.value)
    created_at = Column(DateTime, default=datetime.utcnow)

    team1 = relationship("Team", foreign_keys=[team1_id])
    team2 = relationship("Team", foreign_keys=[team2_id])
    winner = relationship("Team", foreign_keys=[winner_team_id])


class MatchResult(Base):
    """Stores confirmed match results. winner_team_id=None means rain/no result."""
    __tablename__ = "match_results"

    match_id = Column(Integer, primary_key=True)
    winner_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)  # None = rain dispute
    confirmed_at = Column(DateTime, default=datetime.utcnow)


class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, nullable=False)  # References match_data by id (1-based)
    selected_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)  # None = missed bid
    bid_status = Column(String(20), default="pending")  # pending, placed, missed, won, lost, no_result
    amount_won = Column(Integer, nullable=True)  # Net Rs: +profit for won, -50 for lost, 0 for no_result
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="bids")
    selected_team = relationship("Team", foreign_keys=[selected_team_id])
