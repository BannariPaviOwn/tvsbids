import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminGetUsers, adminSetUserActive } from '../api';

export function Admin() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminGetUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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

      <section className="admin-section">
        <h2>Users</h2>
        <p className="admin-subtitle">Deactivate users to prevent them from logging in.</p>

        {error && <p className="auth-error">{error}</p>}
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
    </div>
  );
}
