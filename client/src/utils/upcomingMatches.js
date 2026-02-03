/**
 * Get matches starting within the next N minutes (default 60).
 * Returns matches that are not yet locked but will start soon.
 */
export function getMatchesStartingSoon(matches, withinMinutes = 60) {
  const now = Date.now();
  const windowEnd = now + withinMinutes * 60 * 1000;

  return matches.filter((m) => {
    if (m.is_locked) return false;
    const matchDt = new Date(`${m.match_date}T${m.match_time}`);
    const matchTime = matchDt.getTime();
    return matchTime > now && matchTime <= windowEnd;
  });
}

/**
 * Get sample upcoming matches for demo when none start within 60 min.
 * Returns next 2 future, unlocked matches so the reminder banner can always show.
 * If none exist, returns a hardcoded sample so the banner is visible for testing.
 */
export function getSampleUpcomingMatches(matches, limit = 2) {
  const now = Date.now();
  const future = matches
    .filter((m) => {
      if (m.is_locked) return false;
      const matchDt = new Date(`${m.match_date}T${m.match_time}`);
      return matchDt.getTime() > now;
    })
    .sort((a, b) => {
      const ta = new Date(`${a.match_date}T${a.match_time}`).getTime();
      const tb = new Date(`${b.match_date}T${b.match_time}`).getTime();
      return ta - tb;
    })
    .slice(0, limit);

  if (future.length > 0) return future;

  // Fallback: hardcoded sample so banner always shows for demo
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = tomorrow.toISOString().slice(0, 10);
  return [
    { id: 'sample1', match_date: d, match_time: '14:00', team1: { short_name: 'IND' }, team2: { short_name: 'AUS' } },
    { id: 'sample2', match_date: d, match_time: '19:00', team1: { short_name: 'ENG' }, team2: { short_name: 'PAK' } },
  ];
}
