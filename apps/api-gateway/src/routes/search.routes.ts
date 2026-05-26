import { Hono } from 'hono';
import type { HonoEnv } from '../types/gateway.types';
import { getEnv } from '../config';
import { proxyJson } from '../services/proxy.service';

/**
 * GET /search?q=<term>
 *
 * Proxies to the page-service's /search endpoint, which queries the
 * search_index table (pg_trgm GIN-indexed) for pages and blocks matching
 * the given term. Returns up to 50 results ordered by recency.
 *
 * No auth middleware here — the page-service enforces its own JWT check.
 */
export const searchRoutes = new Hono<HonoEnv>();

searchRoutes.get('/search', async (c) => {
  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const q       = c.req.query('q') ?? '';
  const { data, status } = await proxyJson(pageUrl, '/search', { query: { q } });
  return c.json(data, status as any);
});
