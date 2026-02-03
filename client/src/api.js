const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

function getHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.detail) ? err.detail[0]?.msg || err.detail[0] : err.detail;
    throw new Error(msg || 'Login failed');
  }
  return res.json();
}

export async function register(username, password, mobileNumber) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password, mobile_number: mobileNumber }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.detail) ? err.detail[0]?.msg || err.detail[0] : err.detail;
    throw new Error(msg || 'Registration failed');
  }
  return res.json();
}

export async function getMatches(series) {
  const url = series ? `${API_BASE}/matches/?series=${encodeURIComponent(series)}` : `${API_BASE}/matches/`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

export async function getTodayMatches() {
  const res = await fetch(`${API_BASE}/matches/today`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

export async function getBidStats() {
  const res = await fetch(`${API_BASE}/users/bid-stats`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch bid stats');
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/users/me`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/users/dashboard-stats`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function placeBid(matchId, selectedTeamId) {
  const res = await fetch(`${API_BASE}/bids/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ match_id: matchId, selected_team_id: selectedTeamId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to place bid');
  }
  return res.json();
}

export async function getMyBidForMatch(matchId) {
  const res = await fetch(`${API_BASE}/bids/for-match/${matchId}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch bid');
  return res.json();
}

export async function getMatchBidBreakdown(matchId) {
  const res = await fetch(`${API_BASE}/matches/${matchId}/bid-breakdown`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch bid breakdown');
  return res.json();
}

export async function getTeams() {
  const res = await fetch(`${API_BASE}/matches/teams`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
}

export async function getLeaderboard() {
  const res = await fetch(`${API_BASE}/users/leaderboard`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function adminGetUsers() {
  const res = await fetch(`${API_BASE}/users/admin/users`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function adminSetUserActive(userId, isActive) {
  const res = await fetch(`${API_BASE}/users/admin/users/${userId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
}
