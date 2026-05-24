import { Elysia } from 'elysia';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users } from '@workspace/db/src/schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
const app = new Elysia();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const hashPassword = (password: string) =>
  crypto.createHash('sha256').update(password).digest('hex');

app.get('/', () => ({ status: 'ok', service: 'auth-service' }));

app.post('/register', async ({ body, set }) => {
  const data = registerSchema.parse(body);
  const existing = await db.select().from(users).where(users.email.eq(data.email));
  if (existing.length) return set.status(409).text('Email already exists');
  const now = new Date();
  const [user] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      email: data.email,
      passwordHash: hashPassword(data.password),
      name: data.name,
      createdAt: now,
      updatedAt: now
    })
    .returning();
  return { user: { id: user.id, email: user.email, name: user.name } };
});

app.post('/login', async ({ body, set }) => {
  const data = loginSchema.parse(body);
  const [user] = await db.select().from(users).where(users.email.eq(data.email));
  if (!user || user.passwordHash !== hashPassword(data.password)) {
    return set.status(401).text('Unauthorized');
  }
  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '7d'
  });
  return { token };
});

app.listen(process.env.PORT ? Number(process.env.PORT) : 8083);
