import { Hono } from 'hono';
import type { HonoEnv } from '../types/gateway.types';
import { getEnv } from '../config';
import { requireAuth } from '../middleware/auth';

export const authRoutes = new Hono<HonoEnv>();

/**
 * Proxy all /auth/* requests to the auth-service's /api/auth/* endpoints.
 *
 * Gateway path → Auth-service path mapping:
 *   POST /auth/sign-up/email   → POST  /api/auth/sign-up/email
 *   POST /auth/sign-in/email   → POST  /api/auth/sign-in/email
 *   POST /auth/sign-out        → POST  /api/auth/sign-out
 *   GET  /auth/get-session     → GET   /api/auth/get-session
 *
 * All request headers (including Cookie and Authorization) are forwarded
 * verbatim so better-auth can read session cookies and Bearer tokens.
 */
authRoutes.all('/auth/*', async (c) => {
  const authUrl = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');
  const suffix  = c.req.path.slice('/auth'.length); // e.g. /sign-in/email
  const qs      = new URL(c.req.url).search;
  const target  = `${authUrl}/api/auth${suffix}${qs}`;

  const init: RequestInit = {
    method:  c.req.method,
    headers: c.req.raw.headers,
    signal:  AbortSignal.timeout(10_000)
  };
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    init.body = c.req.raw.body;
  }

  try {
    const res = await fetch(target, init);
    return new Response(res.body, {
      status:     res.status,
      statusText: res.statusText,
      headers:    res.headers
    });
  } catch {
    return c.json({ error: 'Auth service unavailable' }, 503);
  }
});

/**
 * GET /me — returns the currently authenticated user.
 * Kept for backward compatibility with any existing API consumers.
 */
authRoutes.get('/me', requireAuth, (c) => {
  const p = c.var.jwtPayload as { sub: string; email: string; name?: string | null };
  return c.json({ user: { id: p.sub, email: p.email, name: p.name ?? null } });
});
