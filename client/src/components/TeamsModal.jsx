import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getTeams } from '../api';
import { getTeamFlagUrl } from '../utils/teamFlags';

const SAMPLE_TEAMS = [
  { id: 1, name: "India", short_name: "IND" },
  { id: 2, name: "Pakistan", short_name: "PAK" },
  { id: 3, name: "Sri Lanka", short_name: "SL" },
  { id: 4, name: "Scotland", short_name: "SCO" },
  { id: 5, name: "Afghanistan", short_name: "AFG" },
  { id: 6, name: "UAE", short_name: "UAE" },
  { id: 7, name: "Oman", short_name: "OMA" },
  { id: 8, name: "West Indies", short_name: "WI" },
  { id: 9, name: "USA", short_name: "USA" },
  { id: 10, name: "Canada", short_name: "CAN" },
  { id: 11, name: "Australia", short_name: "AUS" },
  { id: 12, name: "New Zealand", short_name: "NZ" },
  { id: 13, name: "South Africa", short_name: "SA" },
  { id: 14, name: "Namibia", short_name: "NAM" },
  { id: 15, name: "Zimbabwe", short_name: "ZIM" },
  { id: 16, name: "Ireland", short_name: "IRE" },
  { id: 17, name: "England", short_name: "ENG" },
  { id: 18, name: "Netherlands", short_name: "NED" },
  { id: 19, name: "Italy", short_name: "ITA" },
  { id: 20, name: "Nepal", short_name: "NEP" },
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
