import { supabaseForToken } from '../lib/supabase.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const supabase = supabaseForToken(token);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid or expired session' });
    req.user = data.user;
    req.supabase = supabase;
    next();
  } catch {
    return res.status(401).json({ error: 'Unable to verify session' });
  }
}
