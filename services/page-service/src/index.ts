import { Elysia } from 'elysia';
import { z } from 'zod';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pages } from '@workspace/db/src/schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
const app = new Elysia();

const pageSchema = z.object({
  title: z.string().min(1),
  parentId: z.string().nullable().optional()
});

app.get('/', () => ({ status: 'ok', service: 'page-service' }));

app.get('/pages', async ({ query }) => {
  const parentId = query('parentId');
  let builder = db.select().from(pages);
  if (parentId) builder = builder.where(pages.parentId.eq(parentId));
  const result = await builder;
  return { pages: result };
});

app.post('/pages', async ({ body }) => {
  const data = pageSchema.parse(body);
  const now = new Date();
  const [page] = await db
    .insert(pages)
    .values({
      id: crypto.randomUUID(),
      title: data.title,
      parentId: data.parentId ?? null,
      createdAt: now,
      updatedAt: now
    })
    .returning();
  return { page };
});

app.get('/pages/:id', async ({ params }) => {
  const [page] = await db.select().from(pages).where(pages.id.eq(params.id));
  return page ?? null;
});

app.put('/pages/:id', async ({ params, body }) => {
  const data = pageSchema.parse(body);
  const now = new Date();
  const [page] = await db
    .update(pages)
    .set({ title: data.title, parentId: data.parentId ?? null, updatedAt: now })
    .where(pages.id.eq(params.id))
    .returning();
  return page ?? null;
});

app.delete('/pages/:id', async ({ params }) => {
  await db.delete(pages).where(pages.id.eq(params.id));
  return { deleted: true };
});

app.listen(process.env.PORT ? Number(process.env.PORT) : 8082);
