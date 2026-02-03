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
  const [series, setSeries] = useState('all');  // all, ipl, worldcup
  const [filter, setFilter] = useState('all');  // all, today
  const [showTeams, setShowTeams] = useState(false);

  const fetchMatches = (seriesFilter) => {
    const s = seriesFilter === 'all' ? null : seriesFilter;
    return getMatches(s)
      .then((m) => (m?.length > 0 ? m : getSampleMatches(s)))
      .catch(() => getSampleMatches(s));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMatches(series), getBidStats()])
      .then(([m, s]) => {
        setMatches(m);
        setBidStats(s);
      })
      .catch(() => {
        setMatches(getSampleMatches(series === 'all' ? null : series));
        setBidStats({ league_remaining: 30, league_limit: 30, semi_remaining: 2, semi_limit: 2, final_remaining: 1, final_limit: 1 });
      })
      .finally(() => setLoading(false));
  }, [series]);

  const refresh = () => {
    setLoading(true);
    const s = series === 'all' ? null : series;
    Promise.all([fetchMatches(series), getBidStats()])
      .then(([m, bidS]) => {
        setMatches(m);
        setBidStats(bidS);
      })
      .catch(() => {
        setMatches(getSampleMatches(s));
        setBidStats({ league_remaining: 30, league_limit: 30, semi_remaining: 2, semi_limit: 2, final_remaining: 1, final_limit: 1 });
      })
      .finally(() => setLoading(false));
  };

  const dateFiltered = filter === 'today'
    ? matches.filter((m) => m.match_date === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`)
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
        {user?.is_admin && <Link to="/admin" className="nav-link">Admin</Link>}
        <button className="nav-link" onClick={() => setShowTeams(true)}>Teams</button>
      </nav>

      <div className="series-tabs">
        <button
          className={series === 'all' ? 'active' : ''}
          onClick={() => setSeries('all')}
        >
          All
        </button>
        <button
          className="series-tab-coming-soon"
          disabled
          title="Coming soon"
        >
          <span className="ipl-label">IPL</span>
          <span className="coming-soon-badge">
            <span className="lightning">⚡</span> Coming soon
          </span>
        </button>
        <button
          className={series === 'worldcup' ? 'active' : ''}
          onClick={() => setSeries('worldcup')}
        >
          World Cup
        </button>
      </div>

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
          {dateFiltered.length === 0 ? (
            <p className="no-matches">No matches found{series !== 'all' ? ` for ${series}` : ''}.</p>
          ) : (
            dateFiltered.map((match) => (
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
