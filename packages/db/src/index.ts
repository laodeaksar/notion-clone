import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
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
 * Creates a per-request Drizzle client backed by node-postgres (pg).
 * Works with any standard PostgreSQL instance including Replit's built-in DB.
 */
export function createDb(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl, ssl: false });
  return drizzle(pool, { schema });
}

export type Db = ReturnType<typeof createDb>;
