import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import matchesRouter from './routes/matches.js';
import privateRouter from './routes/private.js';

const app = express();
app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.origins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400
}));
app.use(express.json({ limit: '256kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'NexusSport API' }));
app.use('/api', matchesRouter);
app.use('/api', privateRouter);

app.use((err, _req, res, _next) => {
  const status = err.status || (err.message?.includes('CORS') ? 403 : 502);
  res.status(status).json({ error: status === 502 ? 'Upstream service error' : err.message });
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`NexusSport API listening on ${config.port}`);
});
