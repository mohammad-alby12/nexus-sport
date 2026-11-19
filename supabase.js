import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

export function supabaseForToken(token) {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}
