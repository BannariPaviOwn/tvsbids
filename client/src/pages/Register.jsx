import { useState } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../api';
import { useAuth } from '../context/AuthContext';

function normalizeMobile(val) {
  return val.replace(/\D/g, '');
}

function validateMobile(mobile) {
  const m = normalizeMobile(mobile);
  return m.length === 10 && /^[6-9]/.test(m);
}

export function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();

  const handleMobileChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!validateMobile(mobile)) {
      setError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const data = await register(username.trim(), password, mobile);
      authLogin(data);
      window.location.href = '/';
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>TVS-Bids</h1>
        <h2>Create account</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            maxLength={50}
          />
          <input
            type="tel"
            placeholder="Mobile number (10 digits)"
            value={mobile}
            onChange={handleMobileChange}
            autoComplete="tel"
            inputMode="numeric"
            maxLength={10}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
