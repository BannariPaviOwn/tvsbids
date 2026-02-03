import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMatches, getBidStats } from '../api';
import { MatchCard } from '../components/MatchCard';
import { TeamsModal } from '../components/TeamsModal';
import { getSampleMatches } from '../utils/sampleMatches';

export function Matches() {
  const { user, logout } = useAuth();
  const [matches, setMatches] = useState([]);
  const [bidStats, setBidStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showTeams, setShowTeams] = useState(false);

  useEffect(() => {
    Promise.all([getMatches(), getBidStats()])
      .then(([m, s]) => {
        setMatches(m.length > 0 ? m : getSampleMatches());
        setBidStats(s);
      })
      .catch(() => {
        setMatches(getSampleMatches());
        setBidStats({ league_remaining: 30, league_limit: 30, semi_remaining: 2, semi_limit: 2, final_remaining: 1, final_limit: 1 });
      })
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    Promise.all([getMatches(), getBidStats()])
      .then(([m, s]) => {
        setMatches(m.length > 0 ? m : getSampleMatches());
        setBidStats(s);
      })
      .catch(() => {
        setMatches(getSampleMatches());
        setBidStats({ league_remaining: 30, league_limit: 30, semi_remaining: 2, semi_limit: 2, final_remaining: 1, final_limit: 1 });
      })
      .finally(() => setLoading(false));
  };

  const filtered = filter === 'today'
    ? matches.filter((m) => m.match_date === new Date().toISOString().slice(0, 10))
    : matches;

  return (
    <div className="matches-page">
      <header className="dashboard-header">
        <h1>TVS-Bids</h1>
        <div className="header-actions">
          <span className="username">{user?.username}</span>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </header>

      <nav className="main-nav">
        <Link to="/" className="nav-link">Dashboard</Link>
        <Link to="/matches" className="nav-link active">Matches</Link>
        <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
        <button className="nav-link" onClick={() => setShowTeams(true)}>Teams</button>
      </nav>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Matches
        </button>
        <button
          className={filter === 'today' ? 'active' : ''}
          onClick={() => setFilter('today')}
        >
          Today
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading matches...</p>
      ) : (
        <div className="match-list">
          {filtered.length === 0 ? (
            <p className="no-matches">No matches found. Add matches via API or seed data.</p>
          ) : (
            filtered.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                bidStats={bidStats}
                onBidPlaced={refresh}
              />
            ))
          )}
        </div>
      )}
      {showTeams && <TeamsModal onClose={() => setShowTeams(false)} />}
    </div>
  );
}
