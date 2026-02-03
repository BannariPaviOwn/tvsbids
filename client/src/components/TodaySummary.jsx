import { useState } from 'react';

function getTodayMatches(matches) {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return matches
    .filter((m) => m.match_date === today)
    .sort((a, b) => (a.match_time || '').localeCompare(b.match_time || ''));
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m || '00'} ${ampm}`;
}

function buildCopyText(todayMatches, todayStr) {
  const lines = [
    `🏏 Today's Matches — ${todayStr}`,
    '',
    ...todayMatches.map((m) => {
      const pair = `${m.team1?.short_name || 'T1'} vs ${m.team2?.short_name || 'T2'}`;
      const time = formatTime(m.match_time);
      return `• ${pair} — ${time}`;
    }),
  ];
  return lines.join('\n');
}

export function TodaySummary({ matches }) {
  const [copied, setCopied] = useState(false);
  const todayMatches = getTodayMatches(matches || []);

  if (todayMatches.length === 0) return null;

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const handleCopy = async () => {
    const text = buildCopyText(todayMatches, todayStr);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="today-summary">
      <div className="today-summary-header">
        <h3 className="today-summary-title">
          Today&apos;s Matches — {todayStr}
        </h3>
        <button
          type="button"
          className="today-summary-copy"
          onClick={handleCopy}
          title="Copy match summary for WhatsApp"
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <ul className="today-summary-list">
        {todayMatches.map((m) => (
          <li key={m.id || `${m.match_date}-${m.match_time}-${m.team1?.short_name}-${m.team2?.short_name}`}>
            <span className="match-pair">
              {m.team1?.short_name || 'T1'} vs {m.team2?.short_name || 'T2'}
            </span>
            <span className="match-time">{formatTime(m.match_time)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
