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
    created_at = Column(DateTime, default=datetime.utcnow)

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
    status = Column(String(20), default=MatchStatus.UPCOMING.value)
    created_at = Column(DateTime, default=datetime.utcnow)

    team1 = relationship("Team", foreign_keys=[team1_id])
    team2 = relationship("Team", foreign_keys=[team2_id])
    winner = relationship("Team", foreign_keys=[winner_team_id])
    bids = relationship("Bid", back_populates="match")


class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    selected_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)  # None = missed bid
    bid_status = Column(String(20), default="pending")  # pending, placed, missed, won, lost
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="bids")
    match = relationship("Match", back_populates="bids")
    selected_team = relationship("Team", foreign_keys=[selected_team_id])
