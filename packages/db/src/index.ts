import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
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
 * Creates a per-request Drizzle client backed by postgres-js (standard TCP).
 *
 * Using postgres-js instead of the Neon HTTP driver so that the same package
 * works in:
 *   - wrangler dev (local CF Workers emulation via miniflare + nodejs_compat)
 *   - Node.js services (migration scripts)
 *
 * max:1 limits the connection pool to a single connection, which is safe for
 * per-request clients in serverless/edge environments.
 */
export function createDb(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max:     1,
    ssl:     'prefer',    // use TLS if the server supports it, skip if not (local dev)
    prepare: false         // required for serverless — disables prepared statements
  });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;
