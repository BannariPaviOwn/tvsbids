import { useState, useEffect } from 'react';

export function Countdown({ secondsUntilStart, onExpire }) {
  const [secs, setSecs] = useState(secondsUntilStart ?? 0);

  useEffect(() => {
    setSecs(secondsUntilStart ?? 0);
  }, [secondsUntilStart]);

  useEffect(() => {
    if (secs <= 0) {
      onExpire?.();
      return;
    }
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secs, onExpire]);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n) => String(n).padStart(2, '0');

  if (secs <= 0) return <span className="countdown expired">Match started</span>;
  return (
    <span className="countdown">
      {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}
    </span>
  );
}
