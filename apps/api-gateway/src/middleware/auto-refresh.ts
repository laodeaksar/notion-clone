import { createMiddleware } from 'hono/factory';
import type { HonoEnv } from '../types/gateway.types';
import {
  extractToken,
  extractRefreshToken,
  secondsUntilExpiry,
  verifyJWT
} from '../lib/jwt';
import { getEnv } from '../config';
import { proxyJson } from '../services/proxy.service';

/**
 * How many seconds before expiry the gateway proactively refreshes the token.
 * Default: 5 minutes. Tune via REFRESH_THRESHOLD env var if needed.
 */
const REFRESH_THRESHOLD = 5 * 60;

/**
 * In-flight refresh tracking — prevents concurrent requests from each
 * triggering a separate refresh when a token is near expiry within the same
 * Workers isolate. Keyed by refresh token value.
 */
const inFlightRefreshes = new Set<string>();

/**
 * autoRefreshMiddleware — runs on every authenticated request.
 *
 * If the access token is valid but expiring within REFRESH_THRESHOLD seconds,
 * AND a `refresh_token` cookie is present, the gateway silently exchanges it
 * for a fresh access token from the auth-service and:
 *   1. Sets a new `token` cookie on the response (transparent to the client).
 *   2. Stores the verified fresh payload in `c.var.jwtPayload` so the
 *      downstream `requireAuth` middleware skips the second verification.
 *
 * If the refresh call fails for any reason the request continues unchanged —
 * the existing (still-valid) token will be used by `requireAuth` normally.
 */
export const autoRefreshMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const token = await extractToken(c as any);
  if (!token) return next();

  const ttl = secondsUntilExpiry(token);

  // Token has no expiry, is far from expiry, or already expired — skip
  if (ttl === null || ttl > REFRESH_THRESHOLD || ttl <= 0) return next();

  const refreshToken = extractRefreshToken(c as any);
  if (!refreshToken) return next();

  // Prevent concurrent refresh races within the same isolate
  if (inFlightRefreshes.has(refreshToken)) return next();
  inFlightRefreshes.add(refreshToken);

  const authUrl = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');

  try {
    const { data, status } = await proxyJson<{ token?: string }>(authUrl, '/refresh', {
      method:  'POST',
      body:    JSON.stringify({ refreshToken }),
      headers: { 'content-type': 'application/json' }
    });

    if (status === 200 && data.token) {
      c.header('set-cookie', `token=${data.token}; HttpOnly; Path=/; SameSite=Lax`);

      const secret       = getEnv(c, 'JWT_SECRET', 'dev-secret');
      const freshPayload = await verifyJWT(data.token, secret);
      if (freshPayload) c.set('jwtPayload', freshPayload);
    }
  } catch {
    // Refresh failed — silently continue; requireAuth will validate the old token
  } finally {
    inFlightRefreshes.delete(refreshToken);
  }

  return next();
});
