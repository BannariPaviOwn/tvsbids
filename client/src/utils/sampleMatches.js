export function getSampleMatches(seriesFilter) {
  const today = new Date();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const matches = [
    { team1: { id: 1, name: "India", short_name: "IND" }, team2: { id: 2, name: "Australia", short_name: "AUS" }, match_time: "14:00", match_type: "league", dayOffset: 0, venue: "Wankhede Stadium, Mumbai", series: "worldcup" },
    { team1: { id: 10, name: "Afghanistan", short_name: "AFG" }, team2: { id: 6, name: "New Zealand", short_name: "NZ" }, match_time: "15:30", match_type: "league", dayOffset: 0, venue: "Eden Gardens, Kolkata", series: "worldcup" },
    { team1: { id: 3, name: "England", short_name: "ENG" }, team2: { id: 4, name: "Pakistan", short_name: "PAK" }, match_time: "19:00", match_type: "league", dayOffset: 1, venue: "Chinnaswamy Stadium, Bengaluru", series: "worldcup" },
    { team1: { id: 5, name: "South Africa", short_name: "SA" }, team2: { id: 7, name: "West Indies", short_name: "WI" }, match_time: "14:00", match_type: "league", dayOffset: 1, venue: "MA Chidambaram Stadium, Chennai", series: "worldcup" },
    { team1: { id: 8, name: "Sri Lanka", short_name: "SL" }, team2: { id: 9, name: "Bangladesh", short_name: "BAN" }, match_time: "15:30", match_type: "league", dayOffset: 2, venue: "Arun Jaitley Stadium, Delhi", series: "worldcup" },
    { team1: { id: 1, name: "India", short_name: "IND" }, team2: { id: 3, name: "England", short_name: "ENG" }, match_time: "19:00", match_type: "league", dayOffset: 2, venue: "Narendra Modi Stadium, Ahmedabad", series: "worldcup" },
    { team1: { id: 2, name: "Australia", short_name: "AUS" }, team2: { id: 10, name: "Afghanistan", short_name: "AFG" }, match_time: "14:00", match_type: "league", dayOffset: 3, venue: "Wankhede Stadium, Mumbai", series: "worldcup" },
    { team1: { id: 6, name: "New Zealand", short_name: "NZ" }, team2: { id: 4, name: "Pakistan", short_name: "PAK" }, match_time: "14:00", match_type: "semi", dayOffset: 4, venue: "Eden Gardens, Kolkata", series: "worldcup" },
    { team1: { id: 1, name: "India", short_name: "IND" }, team2: { id: 5, name: "South Africa", short_name: "SA" }, match_time: "19:00", match_type: "semi", dayOffset: 5, venue: "Wankhede Stadium, Mumbai", series: "worldcup" },
    { team1: { id: 5, name: "South Africa", short_name: "SA" }, team2: { id: 1, name: "India", short_name: "IND" }, match_time: "19:00", match_type: "final", dayOffset: 6, venue: "Narendra Modi Stadium, Ahmedabad", series: "worldcup" },
    { team1: { id: 1, name: "India", short_name: "IND" }, team2: { id: 2, name: "Australia", short_name: "AUS" }, match_time: "19:30", match_type: "league", dayOffset: 0, venue: "Wankhede Stadium, Mumbai", series: "ipl" },
    { team1: { id: 3, name: "England", short_name: "ENG" }, team2: { id: 4, name: "Pakistan", short_name: "PAK" }, match_time: "19:30", match_type: "league", dayOffset: 1, venue: "Chinnaswamy Stadium, Bengaluru", series: "ipl" },
    { team1: { id: 5, name: "South Africa", short_name: "SA" }, team2: { id: 6, name: "New Zealand", short_name: "NZ" }, match_time: "19:30", match_type: "league", dayOffset: 2, venue: "Eden Gardens, Kolkata", series: "ipl" },
  ];
  let filtered = seriesFilter ? matches.filter((m) => m.series === seriesFilter) : matches;
  return filtered.map((m, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + m.dayOffset);
    const matchDate = fmt(d);
    const matchDt = new Date(`${matchDate}T${m.match_time}`);
    const secs = Math.max(0, Math.floor((matchDt - new Date()) / 1000));
    return {
      id: `${m.series}-${i + 1}`,
      team1: m.team1,
      team2: m.team2,
      match_date: matchDate,
      match_time: m.match_time,
      venue: m.venue || null,
      match_type: m.match_type,
      series: m.series || "worldcup",
      status: "upcoming",
      is_locked: secs <= 0,
      seconds_until_start: secs > 0 ? secs : null,
    };
  });
}
