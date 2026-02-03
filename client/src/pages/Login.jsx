import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login: authLogin } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    authLogin({
      access_token: 'dev-token',
      token_type: 'bearer',
      user: { id: 1, username: username || 'guest', created_at: new Date().toISOString() },
    });
    window.location.href = '/';
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>TVS-Bids</h1>
        <h2>Sign in</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button type="submit">Sign in</button>
        </form>
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
