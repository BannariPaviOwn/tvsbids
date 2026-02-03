import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMatches, getBidStats } from '../api';
import { MatchCard } from '../components/MatchCard';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [bidStats, setBidStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today

  useEffect(() => {
    Promise.all([getMatches(), getBidStats()])
      .then(([m, s]) => {
        setMatches(m);
        setBidStats(s);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const refresh = () => {
    setLoading(true);
    Promise.all([getMatches(), getBidStats()])
      .then(([m, s]) => {
        setMatches(m);
        setBidStats(s);
      })
      .finally(() => setLoading(false));
  };

  const filtered = filter === 'today'
    ? matches.filter((m) => m.match_date === new Date().toISOString().slice(0, 10))
    : matches;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Cricket Bid Browser</h1>
        <div className="header-actions">
          <span className="username">{user?.username}</span>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </header>

      {bidStats && (
        <div className="bid-stats">
          <div className="stat">
            <span className="stat-label">League</span>
            <span className="stat-value">{bidStats.league_remaining} / {bidStats.league_limit}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Semi</span>
            <span className="stat-value">{bidStats.semi_remaining} / {bidStats.semi_limit}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Final</span>
            <span className="stat-value">{bidStats.final_remaining} / {bidStats.final_limit}</span>
          </div>
        </div>
      )}

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
    </div>
  );
}
