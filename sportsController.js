import { getMatches, supportedSports } from '../services/sportsService.js';

export async function listSports(_req, res) {
  res.json({ sports: supportedSports });
}

export async function matchesForSport(req, res, next) {
  try {
    const result = await getMatches(req.params.sport, req.query.date);
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.json(result);
  } catch (error) {
    next(error);
  }
}
