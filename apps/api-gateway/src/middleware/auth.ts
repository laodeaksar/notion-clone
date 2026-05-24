import { createMiddleware } from 'hono/factory';
import type { HonoEnv } from '../types/gateway.types';
import { verifyJWT, extractToken } from '../lib/jwt';
import { getEnv } from '../config';

/**
 * requireAuth — verifies the JWT and stores the decoded payload in
 * `c.var.jwtPayload`. Short-circuits with 401 if no valid token is found.
 *
 * If `autoRefreshMiddleware` already ran and populated `c.var.jwtPayload`
 * (fresh token was issued this cycle), verification is skipped to avoid
 * redundant crypto work.
 *
 * Usage:
 *   router.post('/resource', requireAuth, vValidator('json', Schema, onErr), handler)
 *   // Access payload inside handler: c.var.jwtPayload
 */
export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
  // Already populated by autoRefreshMiddleware — skip re-verification
  if (c.var.jwtPayload) return next();

  const secret  = getEnv(c, 'JWT_SECRET', 'dev-secret');
  const token   = await extractToken(c as any);
  const payload = token ? await verifyJWT(token, secret) : null;

  if (!payload) return c.json({ error: 'Unauthorized' }, 401);

  c.set('jwtPayload', payload);
  await next();
});
