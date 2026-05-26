import { Hono } from 'hono';
import { createAuth } from './auth';

type Env = {
  DATABASE_URL:        string;
  BETTER_AUTH_SECRET?: string;
  ALLOWED_ORIGINS?:    string;
};

const app = new Hono<{ Bindings: Env }>();

app.get('/ping', (c) =>
  c.json({
    status:    'ok',
    service:   'auth-service',
    version:   '0.0.1',
    timestamp: new Date().toISOString()
  })
);

/**
 * Delegate all better-auth routes to the better-auth handler.
 *
 * Exposed endpoints (examples):
 *   POST /api/auth/sign-up/email     — register
 *   POST /api/auth/sign-in/email     — login → returns { user, session }
 *   POST /api/auth/sign-out          — logout (invalidates session)
 *   GET  /api/auth/get-session       — returns current session (Bearer or cookie)
 */
app.on(
  ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  '/api/auth/**',
  (c) => createAuth(c.env).handler(c.req.raw)
);

app.onError((err, c) => {
  console.error('[auth-service] unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
