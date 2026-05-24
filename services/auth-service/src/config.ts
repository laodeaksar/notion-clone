import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

/**
 * Creates a per-request Drizzle client backed by Neon's HTTP driver.
 * Must be called inside a request handler so CF Workers env bindings
 * are available — never call at module scope.
 */
export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql);
}

export type Db = ReturnType<typeof createDb>;
