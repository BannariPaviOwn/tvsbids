import { useState, useEffect } from 'react';
import { placeBid, getMyBidForMatch } from '../api';
import { getTeamFlagUrl } from '../utils/teamFlags';
import { Countdown } from './Countdown';
import { BidBreakdownModal } from './BidBreakdownModal';

export function MatchCard({ match, bidStats, onBidPlaced }) {
  const [myBid, setMyBid] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyBidForMatch(match.id)
      .then((r) => {
        if (r.has_bid && r.bid) {
          setMyBid(r.bid);
          setSelectedTeamId(null);
        } else {
          setMyBid(null);
        }
      })
      .catch(() => setMyBid(null)); // Backend not available - ignore, use local state only
  }, [match.id]);

  const handleBid = async (teamId) => {
    setError('');
    setSelectedTeamId(teamId);
    setLoading(true);
    try {
      await placeBid(match.id, teamId);
      setMyBid({ selected_team_id: teamId, bid_status: 'placed' });
      setSelectedTeamId(null);
      onBidPlaced?.();
    } catch (e) {
      // Backend not available (e.g. Vercel-only deploy) - keep selection locally, don't show error
      const isOffline = !e.message || e.message === 'Not Found' || e.message.includes('fetch') || e.message.includes('Failed to');
      if (isOffline) {
        setMyBid({ selected_team_id: teamId, bid_status: 'placed' });
        setSelectedTeamId(null);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isLocked = match.is_locked;
  const hasSelection = myBid?.selected_team_id ?? selectedTeamId;
  const canBid = !isLocked && !loading; // Allow changing bid until match starts

  const hasRemaining = () => {
    if (!bidStats) return true;
    if (myBid) return true; // Changing existing bid, no extra slot needed
    if (match.match_type === 'league') return bidStats.league_remaining > 0;
    if (match.match_type === 'semi') return bidStats.semi_remaining > 0;
    if (match.match_type === 'final') return bidStats.final_remaining > 0;
    return false;
  };

  const team1 = match.team1;
  const team2 = match.team2;
  const selectedTeamShort = hasSelection === team1.id ? team1.short_name : hasSelection === team2.id ? team2.short_name : null;
  const [showBreakdown, setShowBreakdown] = useState(false);

  const handleTeamClick = (teamId) => {
    if (isLocked) {
      setShowBreakdown(true);
    } else {
      handleBid(teamId);
    }
  };

  return (
    <div className={`match-card ${isLocked ? 'locked' : ''}`}>
      <div className="match-meta">
        <span className="match-type-badge">{match.match_type.toUpperCase()}</span>
        <div className="match-datetime">
          <span className="match-date">{match.match_date}</span>
          <span className="match-time">{match.match_time}</span>
        </div>
        {match.venue && (
          <div className="match-venue">
            <span className="venue-icon">📍</span>
            <span>{match.venue}</span>
          </div>
        )}
      </div>
      <div className="match-teams">
        <div className="team-block">
          <button
            className={`team-btn ${hasSelection === team1.id ? 'selected' : ''} ${isLocked ? 'view-only' : ''}`}
            disabled={!isLocked && (!canBid || !hasRemaining())}
            onClick={() => handleTeamClick(team1.id)}
          >
            <img src={getTeamFlagUrl(team1.short_name)} alt="" className="team-flag" />
            {team1.short_name}
          </button>
          <span className="team-name">{team1.name}</span>
        </div>
        <span className="vs">VS</span>
        <div className="team-block">
          <button
            className={`team-btn ${hasSelection === team2.id ? 'selected' : ''} ${isLocked ? 'view-only' : ''}`}
            disabled={!isLocked && (!canBid || !hasRemaining())}
            onClick={() => handleTeamClick(team2.id)}
          >
            <img src={getTeamFlagUrl(team2.short_name)} alt="" className="team-flag" />
            {team2.short_name}
          </button>
          <span className="team-name">{team2.name}</span>
        </div>
      </div>
      <div className="match-footer">
        {myBid?.bid_status === 'won' ? (
          <span className="status won">✓ Won</span>
        ) : myBid?.bid_status === 'lost' ? (
          <span className="status lost">✗ Lost</span>
        ) : isLocked ? (
          <>
            {selectedTeamShort ? (
              <span className="status locked">Bidding closed — you picked {selectedTeamShort}</span>
            ) : (
              <span className="status locked">Bidding closed — no team selected</span>
            )}
            <span className="status-hint">Tap a team to see who bid</span>
          </>
        ) : (myBid || hasSelection) ? (
          <span className="status bid-placed">Bid placed</span>
        ) : (
          <Countdown
            secondsUntilStart={match.seconds_until_start}
            onExpire={onBidPlaced}
          />
        )}
      </div>
      {error && <p className="match-error">{error}</p>}
      {showBreakdown && (
        <BidBreakdownModal match={match} onClose={() => setShowBreakdown(false)} />
      )}
    </div>
  );
}
