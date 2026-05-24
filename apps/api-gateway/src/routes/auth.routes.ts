import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import type { HonoEnv } from '../types/gateway.types';
import { RegisterBodySchema, LoginBodySchema } from '../types/gateway.types';
import { getEnv } from '../config';
import { proxyJson } from '../services/proxy.service';
import { requireAuth } from '../middleware/auth';
import { extractRefreshToken } from '../lib/jwt';

const onInvalid = (result: any, c: any) => {
  if (!result.success) {
    return c.json({ error: 'Invalid input', issues: result.issues }, 400);
  }
};

export const authRoutes = new Hono<HonoEnv>();

authRoutes.post(
  '/auth/register',
  vValidator('json', RegisterBodySchema, onInvalid),
  async (c) => {
    const body    = c.req.valid('json');
    const authUrl = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');
    const { data, status } = await proxyJson(authUrl, '/register', {
      method:  'POST',
      body:    JSON.stringify(body),
      headers: { 'content-type': 'application/json' }
    });
    return c.json(data, status as any);
  }
);

authRoutes.post(
  '/auth/login',
  vValidator('json', LoginBodySchema, onInvalid),
  async (c) => {
    const body    = c.req.valid('json');
    const authUrl = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');
    const { data, status } = await proxyJson<{ token?: string; refreshToken?: string }>(
      authUrl, '/login', {
        method:  'POST',
        body:    JSON.stringify(body),
        headers: { 'content-type': 'application/json' }
      }
    );

    if (status === 200) {
      if (data.token) {
        c.header('set-cookie', `token=${data.token}; HttpOnly; Path=/; SameSite=Lax`);
      }
      if (data.refreshToken) {
        c.header(
          'set-cookie',
          `refresh_token=${data.refreshToken}; HttpOnly; Path=/auth/refresh; SameSite=Lax`,
          { append: true }
        );
      }
    }
    return c.json(data, status as any);
  }
);

/**
 * POST /auth/refresh
 *
 * Exchanges a refresh token for a fresh access token.
 * The refresh token is read from the `refresh_token` httpOnly cookie first;
 * falls back to `{ refreshToken }` in the JSON body for non-browser clients.
 *
 * On success the gateway sets a new `token` cookie transparently — no client-side
 * token storage is needed.
 */
authRoutes.post('/auth/refresh', async (c) => {
  // 1. Try cookie (preferred — browser clients)
  let refreshToken: string | null = extractRefreshToken(c as any);

  // 2. Fallback to JSON body (e.g. mobile / API clients)
  if (!refreshToken) {
    try {
      const body = await c.req.json<{ refreshToken?: string }>();
      refreshToken = body.refreshToken ?? null;
    } catch {
      // body wasn't JSON — ignore
    }
  }

  if (!refreshToken) {
    return c.json({ error: 'No refresh token provided' }, 401);
  }

  const authUrl = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');
  const { data, status } = await proxyJson<{ token?: string; refreshToken?: string }>(
    authUrl, '/refresh', {
      method:  'POST',
      body:    JSON.stringify({ refreshToken }),
      headers: { 'content-type': 'application/json' }
    }
  );

  if (status === 200) {
    if (data.token) {
      c.header('set-cookie', `token=${data.token}; HttpOnly; Path=/; SameSite=Lax`);
    }
    if (data.refreshToken) {
      c.header(
        'set-cookie',
        `refresh_token=${data.refreshToken}; HttpOnly; Path=/auth/refresh; SameSite=Lax`,
        { append: true }
      );
    }
  }

  return c.json(data, status as any);
});

/**
 * POST /auth/logout
 *
 * Clears both the access token and refresh token cookies by setting Max-Age=0.
 * Optionally forwards to auth-service so any server-side refresh token record
 * is also invalidated.
 */
authRoutes.post('/auth/logout', async (c) => {
  const refreshToken = extractRefreshToken(c as any);
  const authUrl      = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');

  // Best-effort: tell auth-service to invalidate the refresh token
  if (refreshToken) {
    try {
      await proxyJson(authUrl, '/logout', {
        method:  'POST',
        body:    JSON.stringify({ refreshToken }),
        headers: { 'content-type': 'application/json' }
      });
    } catch {
      // auth-service may not implement /logout — not fatal
    }
  }

  // Expire both cookies regardless of auth-service response
  c.header('set-cookie', 'token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
  c.header(
    'set-cookie',
    'refresh_token=; HttpOnly; Path=/auth/refresh; SameSite=Lax; Max-Age=0',
    { append: true }
  );

  return c.json({ message: 'Logged out successfully' });
});

// requireAuth sets c.var.jwtPayload — or auto-refresh already did it
authRoutes.get('/me', requireAuth, (c) => {
  return c.json({ user: c.var.jwtPayload });
});
