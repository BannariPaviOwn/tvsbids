import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../api';
import { TeamsModal } from '../components/TeamsModal';

function getSampleLeaderboard() {
  return [
    { rank: 1, username: 'pavi', wins: 5, losses: 2, total: 7, amount_won: 150 },
    { rank: 2, username: 'simbu', wins: 4, losses: 3, total: 7, amount_won: 50 },
    { rank: 3, username: 'sax', wins: 3, losses: 2, total: 5, amount_won: 0 },
    { rank: 4, username: 'ks', wins: 3, losses: 4, total: 7, amount_won: -50 },
    { rank: 5, username: 'nimie', wins: 2, losses: 3, total: 5, amount_won: -100 },
  ];
}

function formatAmount(amount) {
  const n = Number(amount);
  if (n >= 0) return `+₹${n}`;
  return `-₹${Math.abs(n)}`;
}

export function Leaderboard() {
  const { user, logout } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTeams, setShowTeams] = useState(false);

  useEffect(() => {
    getLeaderboard()
      .then((data) => setLeaderboard(data || []))
      .catch(() => setLeaderboard(getSampleLeaderboard()))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="leaderboard-page">
      <header className="dashboard-header">
        <h1>TVS-Bids</h1>
        <div className="header-actions">
          <span className="username">{user?.username}</span>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </header>

      <nav className="main-nav">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/matches" className="nav-link">Matches</Link>
        <Link to="/leaderboard" className="nav-link active">Leaderboard</Link>
        {user?.is_admin && <Link to="/admin" className="nav-link">Admin</Link>}
        <button className="nav-link" onClick={() => setShowTeams(true)}>Teams</button>
      </nav>

      <section className="leaderboard-section">
        <h2>Player Leaderboard</h2>
        <p className="leaderboard-subtitle">Ranked by net amount — green = profit, red = loss (League ₹50, Semi ₹100, Final ₹200)</p>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : (
          <div className="leaderboard-table">
            <div className="leaderboard-header">
              <span className="col-rank">#</span>
              <span className="col-name">Player</span>
              <span className="col-wins">Wins</span>
              <span className="col-losses">Losses</span>
              <span className="col-total">Total</span>
              <span className="col-amount">Amount</span>
            </div>
            {leaderboard.length === 0 ? (
              <p className="no-data">No players yet. Place bids to appear on the leaderboard!</p>
            ) : (
              leaderboard.map((entry) => (
                <div
                  key={entry.username}
                  className={`leaderboard-row ${entry.username === user?.username ? 'current-user' : ''}`}
                >
                  <span className="col-rank">
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                  </span>
                  <span className="col-name">{entry.username}</span>
                  <span className="col-wins">{entry.wins}</span>
                  <span className="col-losses">{entry.losses}</span>
                  <span className="col-total">{entry.total}</span>
                  <span
                    className={`col-amount amount-${(entry.amount_won ?? 0) >= 0 ? 'positive' : 'negative'}`}
                  >
                    {formatAmount(entry.amount_won ?? 0)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>
      {showTeams && <TeamsModal onClose={() => setShowTeams(false)} />}
    </div>
  );
}
