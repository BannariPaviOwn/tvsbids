// Flag images from flagcdn.com (free, no API key)
// West Indies uses custom logo from public/flags/
const FLAG_BASE = 'https://flagcdn.com/w40';
const TEAM_FLAGS = {
  IND: 'in',
  AUS: 'au',
  ENG: 'gb',
  PAK: 'pk',
  SA: 'za',
  NZ: 'nz',
  WI: null,   // Custom West Indies cricket logo
  SL: 'lk',
  BAN: 'bd',
  AFG: 'af',
};

export function getTeamFlagUrl(shortName) {
  const key = shortName?.toUpperCase();
  if (key === 'WI') return '/flags/west-indies.png';
  const code = TEAM_FLAGS[key] || 'xx';
  return `${FLAG_BASE}/${code}.png`;
}
