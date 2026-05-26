import { createMiddleware } from 'hono/factory';
import type { HonoEnv } from '../types/gateway.types';
import { getEnv } from '../config';

/**
 * requireAuth — validates the better-auth session by calling the auth-service's
 * GET /api/auth/get-session endpoint with the session token as a Bearer token.
 *
 * Token source priority:
 *   1. Authorization: Bearer <token> header (API clients, hocuspocus)
 *   2. better-auth.session_token cookie (browser clients)
 *
 * On success, stores the validated user in `c.var.jwtPayload`:
 *   { sub: userId, email: userEmail, name: userName | null }
 *
 * Downstream services receive the user identity via injected headers:
 *   x-user-id    — user's UUID
 *   x-user-email — user's email address
 */
export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
  if (c.var.jwtPayload) return next();

  const authUrl = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');

  // 1. Bearer token from Authorization header
  const bearerToken = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');

  // 2. Session token from cookie
  const cookieHeader = c.req.header('cookie') ?? '';
  const sessionTokenFromCookie = cookieHeader
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('better-auth.session_token='))
    ?.split('=')
    .slice(1)
    .join('=');

  const sessionToken = bearerToken ?? sessionTokenFromCookie;
  if (!sessionToken) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const res = await fetch(`${authUrl}/api/auth/get-session`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
      signal:  AbortSignal.timeout(5_000)
    });

    if (!res.ok) return c.json({ error: 'Unauthorized' }, 401);

    const data = (await res.json()) as {
      user?:    { id: string; email: string; name?: string | null };
      session?: { id: string };
    };

    if (!data.user || !data.session) return c.json({ error: 'Unauthorized' }, 401);

    c.set('jwtPayload', {
      sub:   data.user.id,
      email: data.user.email,
      name:  data.user.name ?? null
    });
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});
