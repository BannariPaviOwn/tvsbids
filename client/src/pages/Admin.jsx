import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminGetUsers, adminSetUserActive, adminGetMatchResults, adminConfirmMatchResult, getMatches } from '../api';

export function Admin() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'results'
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState({});
  const [bidAmounts, setBidAmounts] = useState({ league: 50, semi: 100, final: 200 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState({});

  useEffect(() => {
    Promise.all([adminGetUsers(), getMatches()])
      .then(([u, m]) => {
        setUsers(u);
        setMatches(m || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.is_admin && activeTab === 'results') {
      adminGetMatchResults()
        .then((r) => {
          setResults(r.results || {});
          setBidAmounts(r.bid_amounts || { league: 50, semi: 100, final: 200 });
        })
        .catch(() => setResults({}));
    }
  }, [user?.is_admin, activeTab]);

  const toggleActive = async (userObj) => {
    try {
      await adminSetUserActive(userObj.id, !userObj.is_active);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userObj.id ? { ...u, is_active: !u.is_active } : u
        )
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const handleConfirmResult = async (matchId) => {
    const winnerId = selectedWinner[matchId];
    if (winnerId === undefined) {
      setError('Please select a result first');
      return;
    }
    setConfirming(matchId);
    setError('');
    try {
      await adminConfirmMatchResult(matchId, winnerId === null || winnerId === 0 ? null : winnerId);
      await adminConfirmMatchResult(matchId, winnerId === null || winnerId === 0 ? null : winnerId);
      setResults((prev) => ({ ...prev, [matchId]: winnerId === null || winnerId === 0 ? null : winnerId }));
      setSelectedWinner((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirming(null);
    }
  };

  const lockedMatches = matches.filter((m) => m.is_locked);
  const confirmedMatchIds = new Set(Object.keys(results).map(Number));

  return (
    <div className="admin-page">
      <header className="dashboard-header">
        <h1>TVS-Bids Admin</h1>
        <div className="header-actions">
          <span className="username">{user?.username}</span>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </header>

      <nav className="main-nav">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/matches" className="nav-link">Matches</Link>
        <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
        <Link to="/admin" className="nav-link active">Admin</Link>
        <Link to="/dashboard" className="nav-link">Back to App</Link>
      </nav>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`admin-tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Match Results
        </button>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {activeTab === 'users' && (
        <section className="admin-section">
          <h2>Users</h2>
          <p className="admin-subtitle">Deactivate users to prevent them from logging in.</p>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : (
            <div className="admin-users-table">
              <div className="admin-users-header">
                <span>Username</span>
                <span>Mobile</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {users.map((u) => (
                <div key={u.id} className={`admin-users-row ${!u.is_active ? 'inactive' : ''}`}>
                  <span>{u.username}</span>
                  <span>{u.mobile_number || '—'}</span>
                  <span className={u.is_active ? 'status-active' : 'status-inactive'}>
                    {u.is_active ? 'Active' : 'Deactivated'}
                  </span>
                  <button
                    type="button"
                    className={`btn-toggle ${u.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                    onClick={() => toggleActive(u)}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'results' && (
        <section className="admin-section">
          <h2>Match Results</h2>
          <p className="admin-subtitle">
            Select winner and confirm. &quot;No Result&quot; = rain dispute (no amount deducted). Amounts: League ₹{bidAmounts.league}, Semi ₹{bidAmounts.semi}, Final ₹{bidAmounts.final}
          </p>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : (
            <div className="admin-matches-list">
              {lockedMatches.length === 0 ? (
                <p className="no-data">No matches past their start time yet.</p>
              ) : (
                lockedMatches.map((match) => {
                  const isConfirmed = confirmedMatchIds.has(match.id);
                  const currentSelection = selectedWinner[match.id] ?? results[match.id];
                  return (
                    <div key={match.id} className="admin-match-row">
                      <div className="admin-match-info">
                        <span className="match-teams">
                          {match.team1.short_name} vs {match.team2.short_name}
                          <span className="match-type-badge">{match.match_type}</span>
                          <span className="match-amount">₹{bidAmounts[match.match_type] ?? 50}</span>
                        </span>
                        <span className="match-meta">
                          {match.match_date} {match.match_time} • {match.venue}
                        </span>
                      </div>
                      {isConfirmed ? (
                        <span className="result-badge">
                          {results[match.id] == null
                            ? 'No Result (Rain)'
                            : `Winner: ${match.team1.id === results[match.id] ? match.team1.short_name : match.team2.short_name}`}
                        </span>
                      ) : (
                        <div className="admin-match-actions">
                          <select
                            value={
                              currentSelection === undefined
                                ? ''
                                : currentSelection === null || currentSelection === 0
                                  ? 'none'
                                  : String(currentSelection)
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              setSelectedWinner((prev) => ({
                                ...prev,
                                [match.id]: v === '' ? undefined : v === 'none' ? null : Number(v),
                              }));
                            }}
                          >
                            <option value="">Select result...</option>
                            <option value={match.team1.id}>{match.team1.short_name} wins</option>
                            <option value={match.team2.id}>{match.team2.short_name} wins</option>
                            <option value="none">No Result (Rain)</option>
                          </select>
                          <button
                            className="btn-confirm"
                            disabled={currentSelection === undefined || confirming === match.id}
                            onClick={() => handleConfirmResult(match.id)}
                          >
                            {confirming === match.id ? 'Confirming...' : 'Confirm'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
