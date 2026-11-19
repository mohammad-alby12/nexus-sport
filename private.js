import { Router } from 'express';
import { requireAuth } from './auth.js';

const router = Router();
router.use(requireAuth);

router.get('/watchlist', async (req, res) => {
  const { data, error } = await req.supabase.from('watchlists')
    .select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ items: data });
});

router.post('/watchlist', async (req, res) => {
  const { matchId, sport, matchData } = req.body || {};
  if (!matchId || !['football','basketball','motorsport','badminton','esports'].includes(sport)) {
    return res.status(400).json({ error: 'matchId and valid sport are required' });
  }
  const { data, error } = await req.supabase.from('watchlists')
    .upsert({ user_id: req.user.id, match_id: String(matchId), sport, match_data: matchData || {} },
      { onConflict: 'user_id,match_id' }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ item: data });
});

router.delete('/watchlist/:matchId', async (req, res) => {
  const { error } = await req.supabase.from('watchlists')
    .delete().eq('user_id', req.user.id).eq('match_id', req.params.matchId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ deleted: true });
});

router.post('/votes', async (req, res) => {
  const { matchId, sport, predictedSide } = req.body || {};
  if (!matchId || !predictedSide || !['football','basketball','motorsport','badminton','esports'].includes(sport)) {
    return res.status(400).json({ error: 'matchId, sport and predictedSide are required' });
  }
  const { data, error } = await req.supabase.from('match_votes')
    .upsert({ user_id: req.user.id, match_id: String(matchId), sport, predicted_side: String(predictedSide).slice(0, 120) },
      { onConflict: 'user_id,match_id' }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ vote: data });
});

router.get('/votes/:matchId', async (req, res) => {
  const { data, error } = await req.supabase.from('match_votes')
    .select('predicted_side').eq('match_id', req.params.matchId);
  if (error) return res.status(400).json({ error: error.message });
  const counts = (data || []).reduce((acc, row) => {
    acc[row.predicted_side] = (acc[row.predicted_side] || 0) + 1;
    return acc;
  }, {});
  const total = data?.length || 0;
  res.json({ total, counts: Object.fromEntries(Object.entries(counts).map(([side, count]) => [side, {
    count, percent: total ? Math.round(count * 100 / total) : 0
  }])) });
});

export default router;
