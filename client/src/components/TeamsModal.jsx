import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getTeams } from '../api';
import { getTeamFlagUrl } from '../utils/teamFlags';

const SAMPLE_TEAMS = [
  { id: 1, name: "India", short_name: "IND" },
  { id: 2, name: "Australia", short_name: "AUS" },
  { id: 3, name: "England", short_name: "ENG" },
  { id: 4, name: "Pakistan", short_name: "PAK" },
  { id: 5, name: "South Africa", short_name: "SA" },
  { id: 6, name: "New Zealand", short_name: "NZ" },
  { id: 7, name: "West Indies", short_name: "WI" },
  { id: 8, name: "Sri Lanka", short_name: "SL" },
  { id: 9, name: "Bangladesh", short_name: "BAN" },
  { id: 10, name: "Afghanistan", short_name: "AFG" },
];

export function TeamsModal({ onClose }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    getTeams()
      .then(setTeams)
      .catch(() => setTeams(SAMPLE_TEAMS))
      .finally(() => setLoading(false));
  }, []);

  const displayTeams = teams.length > 0 ? teams : SAMPLE_TEAMS;

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content teams-modal" onClick={(e) => e.stopPropagation()}>
        <div className="teams-modal-header">
          <h3>All Teams</h3>
          <p className="teams-modal-subtitle">Cricket teams in TVS-Bids</p>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="teams-modal-body">
          {loading ? (
            <p className="modal-loading">Loading...</p>
          ) : (
            <div className="teams-grid">
              {displayTeams.map((team) => (
                <div key={team.id} className="team-card">
                  <img src={getTeamFlagUrl(team.short_name)} alt="" className="team-flag" />
                  <div className="team-info">
                    <span className="team-code">{team.short_name}</span>
                    <span className="team-name">{team.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
