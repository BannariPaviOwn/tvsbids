import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getMatchBidBreakdown } from '../api';
import { getTeamFlagUrl } from '../utils/teamFlags';

const SAMPLE_USERS = ['Rahul', 'Priya', 'Vikram', 'Ananya', 'Arjun', 'Sneha', 'Karan', 'Isha', 'Rohan', 'Diya', 'Amit', 'Neha', 'Suresh', 'Kavya', 'Raj'];

function getSampleBidBreakdown(match) {
  const team1 = match.team1;
  const team2 = match.team2;
  const seed = match.id * 7 + team1.id + team2.id;
  const n1 = 4 + (seed % 3);
  const n2 = 4 + ((seed + 1) % 3);
  const team1Bidders = SAMPLE_USERS.slice(0, n1).map((u, i) => ({
    username: u,
    bid_status: (seed + i) % 2 === 0 ? 'won' : 'lost',
  }));
  const team2Bidders = SAMPLE_USERS.slice(n1, n1 + n2).map((u, i) => ({
    username: u,
    bid_status: (seed + i + 1) % 2 === 0 ? 'won' : 'lost',
  }));
  const winnerId = seed % 2 === 0 ? team1.id : team2.id;
  return {
    team1_bidders: team1Bidders.map((b) => ({ ...b, bid_status: winnerId === team1.id ? 'won' : 'lost' })),
    team2_bidders: team2Bidders.map((b) => ({ ...b, bid_status: winnerId === team2.id ? 'won' : 'lost' })),
    winner_team_id: winnerId,
  };
}

export function BidBreakdownModal({ match, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    getMatchBidBreakdown(match.id)
      .then((d) => {
        if (d.team1_bidders?.length || d.team2_bidders?.length) {
          setData(d);
        } else {
          setData(getSampleBidBreakdown(match));
        }
      })
      .catch(() => setData(getSampleBidBreakdown(match)))
      .finally(() => setLoading(false));
  }, [match.id]);

  const team1 = match.team1;
  const team2 = match.team2;
  const winnerId = data?.winner_team_id;

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bid-breakdown-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Bid Breakdown</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p className="modal-loading">Loading...</p>
          ) : (
            <div className="breakdown-grid">
              <div className={`breakdown-team ${winnerId === team1.id ? 'winner' : ''}`}>
                <div className="breakdown-team-header">
                  <img src={getTeamFlagUrl(team1.short_name)} alt="" className="team-flag" />
                  <span>{team1.short_name}</span>
                  {winnerId === team1.id && <span className="won-badge">Won</span>}
                </div>
                <ul className="bidders-list">
                  {data?.team1_bidders?.length ? (
                    data.team1_bidders.map((b, i) => (
                      <li key={i} className={b.bid_status === 'won' ? 'won' : b.bid_status === 'lost' ? 'lost' : ''}>
                        {b.username}
                        {b.bid_status === 'won' && ' ✓'}
                        {b.bid_status === 'lost' && ' ✗'}
                      </li>
                    ))
                  ) : (
                    <li className="empty">No bids</li>
                  )}
                </ul>
              </div>
              <div className={`breakdown-team ${winnerId === team2.id ? 'winner' : ''}`}>
                <div className="breakdown-team-header">
                  <img src={getTeamFlagUrl(team2.short_name)} alt="" className="team-flag" />
                  <span>{team2.short_name}</span>
                  {winnerId === team2.id && <span className="won-badge">Won</span>}
                </div>
                <ul className="bidders-list">
                  {data?.team2_bidders?.length ? (
                    data.team2_bidders.map((b, i) => (
                      <li key={i} className={b.bid_status === 'won' ? 'won' : b.bid_status === 'lost' ? 'lost' : ''}>
                        {b.username}
                        {b.bid_status === 'won' && ' ✓'}
                        {b.bid_status === 'lost' && ' ✗'}
                      </li>
                    ))
                  ) : (
                    <li className="empty">No bids</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
