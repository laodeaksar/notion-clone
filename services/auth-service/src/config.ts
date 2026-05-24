import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const db = drizzle(pool);
export const PORT = process.env.PORT ? Number(process.env.PORT) : 8083;
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
