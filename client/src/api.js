const API_BASE = '/api';

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
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function register(username, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

export async function getMatches() {
  const res = await fetch(`${API_BASE}/matches/`, { headers: getHeaders() });
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
