import type { Context } from 'hono';
import type { HonoEnv } from '../types/gateway.types';
import { getEnv } from '../config';

/**
 * serviceHeaders — builds the full set of trusted headers the gateway injects
 * into every upstream request after session validation.
 *
 * Downstream services validate `x-internal-secret` before trusting identity
 * headers, preventing direct access that bypasses the gateway.
 *
 *   x-user-id         — authenticated user's UUID
 *   x-user-email      — authenticated user's email address
 *   x-internal-secret — shared secret proving the request came from the gateway
 */
export function serviceHeaders(c: Context<HonoEnv>): Record<string, string> {
  const p = c.var.jwtPayload as { sub?: string; email?: string } | undefined;
  const headers: Record<string, string> = {};
  if (p?.sub)   headers['x-user-id']    = p.sub;
  if (p?.email) headers['x-user-email'] = p.email;
  const secret = getEnv(c, 'INTERNAL_SECRET', '');
  if (secret)   headers['x-internal-secret'] = secret;
  return headers;
}
