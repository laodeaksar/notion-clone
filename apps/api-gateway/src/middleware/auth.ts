import { createMiddleware } from 'hono/factory';
import type { HonoEnv } from '../types/gateway.types';
import { verifyJWT, extractToken } from '../lib/jwt';
import { getEnv } from '../config';

/**
 * requireAuth — Hono middleware that verifies the JWT from the Authorization
 * header or `token` cookie. On success it calls next() and stores the decoded
 * payload in `c.var.jwtPayload` (typed via HonoEnv Variables). On failure it
 * short-circuits with 401 so the downstream handler never runs.
 *
 * Usage in a route:
 *   router.post('/resource', requireAuth, vValidator('json', Schema, onErr), handler)
 */
export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
  const secret  = getEnv(c, 'JWT_SECRET', 'dev-secret');
  const token   = await extractToken(c as any);
  const payload = token ? await verifyJWT(token, secret) : null;

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('jwtPayload', payload);
  await next();
});
