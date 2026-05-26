import { Hono } from 'hono';
import { createDb, searchIndex, ilike, desc } from '@workspace/db';
import { authMiddleware } from '../middleware/auth';
import type { HonoEnv } from '../types/env';

/**
 * GET /search?q=<term>
 *
 * Returns up to 50 search_index rows whose body matches the query term using
 * a case-insensitive ILIKE pattern. The GIN trigram index (pg_trgm) created
 * in migration 0005 makes this O(log n) instead of a full sequential scan.
 *
 * Response shape:
 * {
 *   query:   string,
 *   results: Array<{ id, entityType, entityId, pageId, body, updatedAt }>
 * }
 */
export const searchRoutes = new Hono<HonoEnv>()

  .use('*', authMiddleware)

  .get('/', async (c) => {
    const q = c.req.query('q')?.trim() ?? '';

    if (q.length < 2) {
      return c.json({ query: q, results: [] });
    }

    const db      = createDb(c.env.DATABASE_URL);
    const results = await db
      .select()
      .from(searchIndex)
      .where(ilike(searchIndex.body, `%${q}%`))
      .orderBy(desc(searchIndex.updatedAt))
      .limit(50);

    return c.json({ query: q, results });
  });
