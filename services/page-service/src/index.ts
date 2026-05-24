import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { routes } from './routes/index';
import type { HonoEnv } from './types/env';

const app = new Hono<HonoEnv>();

app.use('*', logger());
app.use('*', cors());

app.route('/', routes);

app.onError((err, c) => {
  console.error('[page-service] unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
