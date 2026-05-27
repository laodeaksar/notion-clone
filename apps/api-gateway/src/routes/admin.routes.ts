import { Hono } from 'hono';
import type { HonoEnv } from '../types/gateway.types';
import { getEnv } from '../config';
import { requireAuth } from '../middleware/auth';
import { serviceHeaders } from '../lib/headers';

/**
 * Admin routes — require authentication.
 *
 * POST /admin/reindex
 *   Triggers a full rebuild of the search_index table on the page-service.
 *   Scans all pages and blocks across all users and upserts their text.
 *   Useful after bulk imports, failed indexing runs, or schema migrations.
 *
 *   Response: { indexed: { pages, blocks }, skipped, durationMs }
 */
export const adminRoutes = new Hono<HonoEnv>();

adminRoutes.post('/admin/reindex', requireAuth, async (c) => {
  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');

  try {
    const res = await fetch(`${pageUrl}/reindex`, {
      method:  'POST',
      headers: serviceHeaders(c),
      signal:  AbortSignal.timeout(120_000)   // reindex can take time on large datasets
    });

    const data = await res.json() as unknown;
    return c.json(data, res.status as any);
  } catch (err) {
    console.error('[gateway] reindex proxy error:', err);
    return c.json({ error: 'Reindex request failed' }, 503);
  }
});
