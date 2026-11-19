import NodeCache from 'node-cache';
import { config } from './config.js';

const cache = new NodeCache({ stdTTL: config.cacheTtl, checkperiod: 60, useClones: false });
const SPORTS = {
  football: { label: 'Soccer', apiSport: 'Soccer' },
  basketball: { label: 'Basketball', apiSport: 'Basketball' },
  motorsport: { label: 'Motorsport', apiSport: 'Motorsport' },
  badminton: { label: 'Badminton', apiSport: 'Badminton' },
  esports: { label: 'Esports', apiSport: 'Esports' }
};

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'NexusSport/1.0' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`TheSportsDB returned HTTP ${response.status}`);
  return response.json();
}

function dateKey(date) {
  const parsed = date ? new Date(`${date}T00:00:00Z`) : new Date();
  if (Number.isNaN(parsed.getTime())) throw new Error('Invalid date. Use YYYY-MM-DD.');
  return parsed.toISOString().slice(0, 10);
}

function normalizeEvent(event, sport) {
  const id = String(event.idEvent || event.id || '');
  const home = event.strHomeTeam || event.strEvent?.split(' vs ')[0] || event.strEvent || 'TBD';
  const away = event.strAwayTeam || event.strEvent?.split(' vs ')[1] || '';
  const timestamp = event.strTimestamp || (event.dateEvent && event.strTime ? `${event.dateEvent}T${event.strTime}Z` : null);
  return {
    id,
    matchId: `${sport}:${id || `${event.strEvent || 'event'}:${event.dateEvent || ''}`}`,
    sport,
    title: event.strEvent || [home, away].filter(Boolean).join(' vs '),
    homeTeam: home,
    awayTeam: away,
    homeBadge: event.strHomeTeamBadge || event.strHomeTeamLogo || null,
    awayBadge: event.strAwayTeamBadge || event.strAwayTeamLogo || null,
    date: event.dateEvent || null,
    time: event.strTime || null,
    timestamp,
    status: event.strStatus || event.strProgress || 'Scheduled',
    venue: event.strVenue || null,
    league: event.strLeague || null,
    homeScore: event.intHomeScore ?? null,
    awayScore: event.intAwayScore ?? null,
    thumbnail: event.strThumb || null,
    source: 'TheSportsDB'
  };
}

async function enrichBadge(teamName) {
  if (!teamName) return null;
  const key = `team:${teamName.toLowerCase()}`;
  const existing = cache.get(key);
  if (existing !== undefined) return existing;
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(config.sportsDbKey)}/searchteams.php?t=${encodeURIComponent(teamName)}`;
    const data = await fetchJson(url);
    const badge = data.teams?.[0]?.strBadge || data.teams?.[0]?.strTeamBadge || data.teams?.[0]?.strLogo || null;
    cache.set(key, badge);
    return badge;
  } catch {
    cache.set(key, null, 60);
    return null;
  }
}

export async function getMatches(sport, requestedDate) {
  const definition = SPORTS[sport];
  if (!definition) {
    const error = new Error('Unsupported sport');
    error.status = 404;
    throw error;
  }
  const date = dateKey(requestedDate);
  const key = `matches:${sport}:${date}`;
  const cached = cache.get(key);
  if (cached) return { ...cached, cached: true };

  const url = `https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(config.sportsDbKey)}/eventsday.php?d=${date}&s=${encodeURIComponent(definition.apiSport)}`;
  const payload = await fetchJson(url);
  const events = Array.isArray(payload.events) ? payload.events : [];
  const matches = await Promise.all(events.map(async raw => {
    const match = normalizeEvent(raw, sport);
    if (!match.homeBadge) match.homeBadge = await enrichBadge(match.homeTeam);
    if (!match.awayBadge && match.awayTeam) match.awayBadge = await enrichBadge(match.awayTeam);
    return match;
  }));
  const result = { sport, date, matches, count: matches.length, provider: 'TheSportsDB', cached: false };
  cache.set(key, result);
  return result;
}

export const supportedSports = Object.keys(SPORTS);
