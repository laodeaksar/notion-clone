import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export * from './schema';

// Re-export commonly used Drizzle operators so services only need
// to import from '@workspace/db' — no direct drizzle-orm dependency.
export {
  eq, ne, gt, gte, lt, lte,
  and, or, not,
  asc, desc,
  inArray, notInArray,
  isNull, isNotNull,
  sql, count, sum, avg, min, max
} from 'drizzle-orm';

/**
 * Creates a per-request Drizzle client backed by Neon's HTTP driver.
 *
 * Must be called inside a request handler — never at module scope —
 * so that Cloudflare Workers env bindings are available when needed.
 *
 * @example
 * app.get('/users', async (c) => {
 *   const db = createDb(c.env.DATABASE_URL);
 *   const users = await db.select().from(schema.users);
 *   return c.json({ users });
 * });
 */
export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;
