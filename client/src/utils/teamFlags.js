// Flag images from flagcdn.com (free, no API key)
// West Indies uses custom logo from public/flags/
const FLAG_BASE = 'https://flagcdn.com/w40';
const TEAM_FLAGS = {
  IND: 'in',
  PAK: 'pk',
  SL: 'lk',
  SCO: 'gb',   // Scotland (UK)
  AFG: 'af',
  UAE: 'ae',
  OMA: 'om',
  WI: null,    // Custom West Indies cricket logo
  USA: 'us',
  CAN: 'ca',
  AUS: 'au',
  NZ: 'nz',
  SA: 'za',
  NAM: 'na',
  ZIM: 'zw',
  IRE: 'ie',
  ENG: 'gb',
  NED: 'nl',
  ITA: 'it',
  NEP: 'np',
};

export function getTeamFlagUrl(shortName) {
  const key = shortName?.toUpperCase();
  if (key === 'WI') return '/flags/west-indies.png';
  const code = TEAM_FLAGS[key] || 'xx';
  return `${FLAG_BASE}/${code}.png`;
}
