import { useState, useEffect } from 'react';
import { placeBid, getMyBidForMatch } from '../api';
import { Countdown } from './Countdown';

export function MatchCard({ match, bidStats, onBidPlaced }) {
  const [myBid, setMyBid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyBidForMatch(match.id).then((r) => setMyBid(r.has_bid ? r.bid : null)).catch(() => setMyBid(null));
  }, [match.id]);

  const handleBid = async (teamId) => {
    setError('');
    setLoading(true);
    try {
      await placeBid(match.id, teamId);
      setMyBid({ selected_team_id: teamId, bid_status: 'placed' });
      onBidPlaced?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isLocked = match.is_locked;
  const canBid = !isLocked && !myBid && !loading;

  const hasRemaining = () => {
    if (match.match_type === 'league') return bidStats.league_remaining > 0;
    if (match.match_type === 'semi') return bidStats.semi_remaining > 0;
    if (match.match_type === 'final') return bidStats.final_remaining > 0;
    return false;
  };

  const team1 = match.team1;
  const team2 = match.team2;

  return (
    <div className={`match-card ${isLocked ? 'locked' : ''}`}>
      <div className="match-header">
        <span className="match-type">{match.match_type.toUpperCase()}</span>
        <span className="match-date">{match.match_date} at {match.match_time}</span>
      </div>
      <div className="match-teams">
        <div className="team-block">
          <button
            className={`team-btn ${myBid?.selected_team_id === team1.id ? 'selected' : ''}`}
            disabled={!canBid || !hasRemaining()}
            onClick={() => handleBid(team1.id)}
          >
            {team1.short_name}
          </button>
          <span className="team-name">{team1.name}</span>
        </div>
        <span className="vs">VS</span>
        <div className="team-block">
          <button
            className={`team-btn ${myBid?.selected_team_id === team2.id ? 'selected' : ''}`}
            disabled={!canBid || !hasRemaining()}
            onClick={() => handleBid(team2.id)}
          >
            {team2.short_name}
          </button>
          <span className="team-name">{team2.name}</span>
        </div>
      </div>
      <div className="match-footer">
        {isLocked ? (
          <span className="status locked">Bidding closed</span>
        ) : myBid ? (
          <span className="status bid-placed">Bid placed</span>
        ) : (
          <Countdown
            secondsUntilStart={match.seconds_until_start}
            onExpire={onBidPlaced}
          />
        )}
      </div>
      {error && <p className="match-error">{error}</p>}
    </div>
  );
}
