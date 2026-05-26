import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export * from './schema';

export {
  eq, ne, gt, gte, lt, lte,
  and, or, not,
  asc, desc,
  inArray, notInArray,
  isNull, isNotNull,
  sql, count, sum, avg, min, max,
  like, ilike
} from 'drizzle-orm';

/**
 * Creates a per-request Drizzle client backed by Neon's HTTP driver.
 *
 * Must be called inside a request handler — never at module scope —
 * so that Cloudflare Workers env bindings are available when needed.
 */
export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;
