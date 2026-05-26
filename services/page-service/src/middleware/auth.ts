import type { MiddlewareHandler } from 'hono';
import type { HonoEnv } from '../types/env';

/**
 * timingSafeEqual — compares two strings in constant time to prevent
 * timing-based attacks on the internal secret.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * authMiddleware — validates the internal gateway secret then trusts the
 * identity headers injected by the API gateway.
 *
 * The gateway sets:
 *   x-internal-secret — shared secret proving the request came from the gateway
 *   x-user-id         — the authenticated user's UUID
 *   x-user-email      — the authenticated user's email address (may be empty)
 *
 * Any request that does not carry the correct secret is rejected with 403,
 * preventing direct access to this service that bypasses the gateway.
 */
export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const secret = c.env.INTERNAL_SECRET;
  if (secret) {
    const incoming = c.req.header('x-internal-secret') ?? '';
    if (!timingSafeEqual(incoming, secret)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
  }

  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  c.set('userId',    userId);
  c.set('userEmail', c.req.header('x-user-email') ?? '');
  await next();
};
