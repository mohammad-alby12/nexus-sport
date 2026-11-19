import 'dotenv/config';

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

export const config = {
  port: Number(process.env.PORT || 8080),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  origins: (process.env.FRONTEND_ORIGINS || 'http://localhost:3000')
    .split(',').map(value => value.trim()).filter(Boolean),
  sportsDbKey: process.env.THESPORTSDB_API_KEY || '3',
  cacheTtl: Math.max(30, Number(process.env.CACHE_TTL_SECONDS || 300))
};
