import { cors } from 'hono/cors';
import { createMiddleware } from 'hono/factory';
import type { HonoEnv } from '../types/gateway.types';

/**
 * buildCorsMiddleware — constructs a CORS middleware scoped to the allowed
 * origins configured via the ALLOWED_ORIGINS environment variable.
 *
 * ALLOWED_ORIGINS: comma-separated list of exact origins (scheme + host + port).
 * Example: "https://app.example.com,https://www.example.com"
 *
 * Falls back to localhost:5000 in development when the env var is absent.
 * In production the var MUST be set — the fallback will not match any real domain.
 */
function parseAllowedOrigins(raw?: string): string[] {
  if (!raw) return ['http://localhost:5000'];
  return raw.split(',').map(o => o.trim()).filter(Boolean);
}

export const corsMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const allowedOrigins = parseAllowedOrigins((c.env as any)?.ALLOWED_ORIGINS);

  const handler = cors({
    origin:       (origin) => allowedOrigins.includes(origin) ? origin : null,
    credentials:  true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge:       86_400
  });

  return handler(c, next);
});

/**
 * securityHeadersMiddleware — appends security-relevant HTTP response headers
 * on every reply from the gateway.
 */
export const securityHeadersMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  c.header(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' wss:",
      "object-src 'none'",
      "frame-ancestors 'none'"
    ].join('; ')
  );
});
