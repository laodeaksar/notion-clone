import { Hono } from 'hono';
import type { HonoEnv } from '../types/gateway.types';
import { getEnv } from '../config';
import { proxyJson } from '../services/proxy.service';
import { requireAuth } from '../middleware/auth';

/**
 * GET /search?q=<term>
 *
 * Proxies to the page-service's /search endpoint, which queries the
 * search_index table (pg_trgm GIN-indexed) for pages and blocks matching
 * the given term. Returns up to 50 results ordered by recency.
 *
 * Requires authentication — the page-service uses x-user-id to scope results.
 */
export const searchRoutes = new Hono<HonoEnv>();

searchRoutes.get('/search', requireAuth, async (c) => {
  const pageUrl   = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const q         = c.req.query('q') ?? '';
  const userId    = (c.var.jwtPayload as { sub?: string })?.sub ?? '';
  const userEmail = (c.var.jwtPayload as { email?: string })?.email ?? '';
  const { data, status } = await proxyJson(pageUrl, '/search', {
    query:   { q },
    headers: { 'x-user-id': userId, 'x-user-email': userEmail }
  });
  return c.json(data, status as any);
});
