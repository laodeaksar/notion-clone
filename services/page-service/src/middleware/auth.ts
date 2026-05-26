import type { MiddlewareHandler } from 'hono';
import type { HonoEnv } from '../types/env';

/**
 * authMiddleware — trusts the identity headers injected by the API gateway
 * after it has validated the better-auth session.
 *
 * The gateway sets:
 *   x-user-id    — the authenticated user's UUID
 *   x-user-email — the authenticated user's email address (may be empty)
 */
export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  c.set('userId',    userId);
  c.set('userEmail', c.req.header('x-user-email') ?? '');
  await next();
};
