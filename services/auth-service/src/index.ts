import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { routes } from './routes/index';
import type { HonoEnv } from './types/env';

const app = new Hono<HonoEnv>();

app.use('*', logger());

/**
 * Internal-service CORS — this service is called server-to-server from the
 * API gateway only. Browsers never talk to it directly.
 * GATEWAY_ORIGIN env var should be set to the gateway's internal URL.
 * Defaults to localhost:8080 for local development.
 */
app.use('*', (c, next) => {
  const gatewayOrigin = (c.env as any)?.GATEWAY_ORIGIN ?? 'http://localhost:8080';
  return cors({
    origin:       gatewayOrigin,
    credentials:  false,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  })(c, next);
});

app.get('/ping', (c) => {
  const cf = (c.req.raw as any).cf;
  return c.json({
    status:    'ok',
    service:   'auth-service',
    version:   '0.0.1',
    region:    cf?.colo ?? 'local',
    timestamp: new Date().toISOString()
  });
});

app.route('/', routes);

app.onError((err, c) => {
  console.error('[auth-service] unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
