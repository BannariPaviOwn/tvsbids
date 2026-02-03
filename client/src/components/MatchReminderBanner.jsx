import { useState, useEffect } from 'react';
import { getMatchesStartingSoon, getSampleUpcomingMatches } from '../utils/upcomingMatches';

const NOTIFIED_KEY = 'bid_reminder_notified';
const CHECK_INTERVAL_MS = 60000; // Check every minute
const WHATSAPP_REMINDER_NUMBER = '919750374455'; // India: 91 + 9750374455

export function MatchReminderBanner({ matches }) {
  const [upcoming, setUpcoming] = useState([]);
  const [isSample, setIsSample] = useState(false); // true when showing sample (no matches in 60 min)
  const [dismissed, setDismissed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(null);

  useEffect(() => {
    const check = () => {
      const soon = getMatchesStartingSoon(matches, 60);
      // If no matches in 60-min window, use sample upcoming matches so banner is always visible
      const display = soon.length > 0 ? soon : getSampleUpcomingMatches(matches, 2);
      setUpcoming(display);
      setIsSample(soon.length === 0 && display.length > 0);

      // Browser notification: only for real matches in 1-hour window
      if ('Notification' in window && soon.length > 0) {
        if (Notification.permission === 'granted') {
          const notified = JSON.parse(sessionStorage.getItem(NOTIFIED_KEY) || '[]');
          soon.forEach((m) => {
            const key = `${m.id}-${m.match_date}-${m.match_time}`;
            if (!notified.includes(key)) {
              new Notification('Match starting soon!', {
                body: `${m.team1.short_name} vs ${m.team2.short_name} starts in 1 hour — Bid now!`,
                icon: '/vite.svg',
              });
              notified.push(key);
            }
          });
          sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified.slice(-20)));
        }
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [matches]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((p) => setNotificationPermission(p));
    }
  };

  const shareOnWhatsApp = () => {
    const matchList = upcoming.slice(0, 5).map((m) => `${m.team1.short_name} vs ${m.team2.short_name}`).join('\n• ');
    const intro = isSample
      ? `${upcoming.length} upcoming match${upcoming.length > 1 ? 'es' : ''}. Place your bids before they start!`
      : `${upcoming.length} match${upcoming.length > 1 ? 'es' : ''} starting in 1 hour. Place your bids soon!`;
    const text = `Hi! Cricket Bid reminder:\n\n${intro}\n\n• ${matchList}${upcoming.length > 5 ? `\n• +${upcoming.length - 5} more` : ''}\n\nOpen the app to bid now.`;
    window.open(`https://wa.me/${WHATSAPP_REMINDER_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (upcoming.length === 0 || dismissed) return null;

  return (
    <div className="match-reminder-banner">
      <div className="reminder-content">
        <span className="reminder-icon">⏰</span>
        <span>
          <strong>
            {isSample
              ? `${upcoming.length} upcoming match${upcoming.length > 1 ? 'es' : ''} — Bid before they start!`
              : `${upcoming.length} match${upcoming.length > 1 ? 'es' : ''} starting in 1 hour — Bid soon!`}
          </strong>
          {' '}{upcoming.slice(0, 3).map((m) => `${m.team1.short_name} vs ${m.team2.short_name}`).join(', ')}
          {upcoming.length > 3 && ` +${upcoming.length - 3} more`}
        </span>
      </div>
      <div className="reminder-actions">
        <button className="reminder-btn whatsapp-btn" onClick={shareOnWhatsApp} title="Send reminder to WhatsApp">
          Remind on WhatsApp
        </button>
        {notificationPermission === 'default' && (
          <button className="reminder-btn" onClick={requestNotificationPermission}>
            Enable notifications
          </button>
        )}
        <button className="reminder-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );
}
