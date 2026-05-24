import { Elysia } from 'elysia';
import { z } from 'zod';
import { blocks } from '@workspace/db/src/schema';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const app = new Elysia();

const BlockInput = z.object({
  id: z.string().optional(),
  pageId: z.string(),
  type: z.string(),
  content: z.any(),
  order: z.number().optional()
});

app.get('/', () => ({ status: 'ok', service: 'block-service' }));

app.post('/blocks', async ({ body }) => {
  const parsed = BlockInput.parse(body);
  const now = new Date();
  const insert = await db.insert(blocks).values({
    id: parsed.id ?? crypto.randomUUID(),
    pageId: parsed.pageId,
    type: parsed.type,
    content: parsed.content,
    order: parsed.order ?? 0,
    createdAt: now,
    updatedAt: now
  }).returning();
  return { status: 'created', block: insert };
});

app.get('/blocks', async ({ query }) => {
  const pageId = query.get('pageId');
  if (!pageId) return { error: 'pageId is required' };
  const rows = await db.select().from(blocks).where(blocks.pageId.eq(pageId)).orderBy(blocks.order);
  return rows;
});

app.get('/blocks', async ({ query }) => {
  const pageId = query('pageId');
  if (!pageId) return { blocks: [] };
  const rows = await db.select().from(blocks).where(blocks.pageId.eq(pageId));
  return { blocks: rows };
});

app.get('/blocks/:id', async ({ params }) => {
  const row = await db.select().from(blocks).where(blocks.id.eq(params.id));
  return row[0] ?? null;
});

app.listen(process.env.PORT ? Number(process.env.PORT) : 8081);
