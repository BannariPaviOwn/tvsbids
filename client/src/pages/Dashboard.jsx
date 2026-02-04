import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getBidStats, getMatches } from '../api';
import { TeamsModal } from '../components/TeamsModal';
import { TodaySummary } from '../components/TodaySummary';
import { getSampleMatches } from '../utils/sampleMatches';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [bidStats, setBidStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTeams, setShowTeams] = useState(false);

  useEffect(() => {
    Promise.all([getDashboardStats(), getBidStats(), getMatches()])
      .then(([s, b, m]) => {
        setStats(s);
        setBidStats(b);
        setMatches(m?.length > 0 ? m : getSampleMatches());
      })
      .catch(() => {
        setStats({ total_matches: 0, wins: 0, losses: 0, pending: 0 });
        setBidStats({ league_remaining: 30, league_limit: 30, semi_remaining: 2, semi_limit: 2, final_remaining: 1, final_limit: 1 });
        setMatches(getSampleMatches());
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>TVS-Bids</h1>
        <div className="header-actions">
          <span className="username">{user?.username}</span>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </header>

      <nav className="main-nav">
        <Link to="/dashboard" className="nav-link active">Dashboard</Link>
        <Link to="/matches" className="nav-link">Matches</Link>
        <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
        {user?.is_admin && <Link to="/admin" className="nav-link">Admin</Link>}
        <button className="nav-link" onClick={() => setShowTeams(true)}>Teams</button>
      </nav>

      {!loading && matches.length > 0 && <TodaySummary matches={matches} />}

      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <>
          <section className="dashboard-stats">
            <h2>Your Performance</h2>
            <div className="stats-grid">
              <div className="stat-card total">
                <span className="stat-number">{stats?.total_matches ?? 0}</span>
                <span className="stat-label">Total Matches</span>
              </div>
              <div className="stat-card wins">
                <span className="stat-number">{stats?.wins ?? 0}</span>
                <span className="stat-label">Wins</span>
              </div>
              <div className="stat-card losses">
                <span className="stat-number">{stats?.losses ?? 0}</span>
                <span className="stat-label">Losses</span>
              </div>
              <div className="stat-card pending">
                <span className="stat-number">{stats?.pending ?? 0}</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
          </section>

          {bidStats && (
            <section className="bid-limits">
              <h2>Bids Remaining</h2>
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
            </section>
          )}

          <Link to="/matches" className="btn-matches">
            View & Bid on Matches →
          </Link>
        </>
      )}
      {showTeams && <TeamsModal onClose={() => setShowTeams(false)} />}
    </div>
  );
}
