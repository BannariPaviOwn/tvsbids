import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMatches, getBidStats } from '../api';
import { MatchCard } from '../components/MatchCard';
import { TeamsModal } from '../components/TeamsModal';
import { MatchReminderBanner } from '../components/MatchReminderBanner';

function getSampleMatches() {
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const matches = [
    { team1: { id: 1, name: "India", short_name: "IND" }, team2: { id: 2, name: "Australia", short_name: "AUS" }, match_time: "14:00", match_type: "league", dayOffset: 0, venue: "Wankhede Stadium, Mumbai" },
    { team1: { id: 10, name: "Afghanistan", short_name: "AFG" }, team2: { id: 6, name: "New Zealand", short_name: "NZ" }, match_time: "15:30", match_type: "league", dayOffset: 0, venue: "Eden Gardens, Kolkata" },
    { team1: { id: 3, name: "England", short_name: "ENG" }, team2: { id: 4, name: "Pakistan", short_name: "PAK" }, match_time: "19:00", match_type: "league", dayOffset: 1, venue: "Chinnaswamy Stadium, Bengaluru" },
    { team1: { id: 5, name: "South Africa", short_name: "SA" }, team2: { id: 7, name: "West Indies", short_name: "WI" }, match_time: "14:00", match_type: "league", dayOffset: 1, venue: "MA Chidambaram Stadium, Chennai" },
    { team1: { id: 8, name: "Sri Lanka", short_name: "SL" }, team2: { id: 9, name: "Bangladesh", short_name: "BAN" }, match_time: "15:30", match_type: "league", dayOffset: 2, venue: "Arun Jaitley Stadium, Delhi" },
    { team1: { id: 1, name: "India", short_name: "IND" }, team2: { id: 3, name: "England", short_name: "ENG" }, match_time: "19:00", match_type: "league", dayOffset: 2, venue: "Narendra Modi Stadium, Ahmedabad" },
    { team1: { id: 2, name: "Australia", short_name: "AUS" }, team2: { id: 10, name: "Afghanistan", short_name: "AFG" }, match_time: "14:00", match_type: "league", dayOffset: 3, venue: "Wankhede Stadium, Mumbai" },
    { team1: { id: 6, name: "New Zealand", short_name: "NZ" }, team2: { id: 4, name: "Pakistan", short_name: "PAK" }, match_time: "14:00", match_type: "semi", dayOffset: 4, venue: "Eden Gardens, Kolkata" },
    { team1: { id: 1, name: "India", short_name: "IND" }, team2: { id: 5, name: "South Africa", short_name: "SA" }, match_time: "19:00", match_type: "semi", dayOffset: 5, venue: "Wankhede Stadium, Mumbai" },
    { team1: { id: 5, name: "South Africa", short_name: "SA" }, team2: { id: 1, name: "India", short_name: "IND" }, match_time: "19:00", match_type: "final", dayOffset: 6, venue: "Narendra Modi Stadium, Ahmedabad" },
  ];
  return matches.map((m, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + m.dayOffset);
    const matchDate = fmt(d);
    const matchDt = new Date(`${matchDate}T${m.match_time}`);
    const secs = Math.max(0, Math.floor((matchDt - new Date()) / 1000));
    return {
      id: i + 1,
      team1: m.team1,
      team2: m.team2,
      match_date: matchDate,
      match_time: m.match_time,
      venue: m.venue || null,
      match_type: m.match_type,
      status: "upcoming",
      is_locked: secs <= 0,
      seconds_until_start: secs > 0 ? secs : null,
    };
  });
}

export function Matches() {
  const { user, logout } = useAuth();
  const [matches, setMatches] = useState([]);
  const [bidStats, setBidStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showTeams, setShowTeams] = useState(false);

  useEffect(() => {
    Promise.all([getMatches(), getBidStats()])
      .then(([m, s]) => {
        setMatches(m.length > 0 ? m : getSampleMatches());
        setBidStats(s);
      })
      .catch(() => {
        setMatches(getSampleMatches());
        setBidStats({ league_remaining: 30, league_limit: 30, semi_remaining: 2, semi_limit: 2, final_remaining: 1, final_limit: 1 });
      })
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    Promise.all([getMatches(), getBidStats()])
      .then(([m, s]) => {
        setMatches(m.length > 0 ? m : getSampleMatches());
        setBidStats(s);
      })
      .catch(() => {
        setMatches(getSampleMatches());
        setBidStats({ league_remaining: 30, league_limit: 30, semi_remaining: 2, semi_limit: 2, final_remaining: 1, final_limit: 1 });
      })
      .finally(() => setLoading(false));
  };

  const filtered = filter === 'today'
    ? matches.filter((m) => m.match_date === new Date().toISOString().slice(0, 10))
    : matches;

  return (
    <div className="matches-page">
      <header className="dashboard-header">
        <h1>Cricket Bid Browser</h1>
        <div className="header-actions">
          <span className="username">{user?.username}</span>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </header>

      <nav className="main-nav">
        <Link to="/" className="nav-link">Dashboard</Link>
        <Link to="/matches" className="nav-link active">Matches</Link>
        <button className="nav-link" onClick={() => setShowTeams(true)}>Teams</button>
      </nav>

      <MatchReminderBanner matches={matches} />

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
      {showTeams && <TeamsModal onClose={() => setShowTeams(false)} />}
    </div>
  );
}
