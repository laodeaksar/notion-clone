import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import * as v from 'valibot';
import { createDb, pageComments, pages, eq, and } from '@workspace/db';
import { authMiddleware } from '../middleware/auth';
import type { HonoEnv } from '../types/env';
import { randomUUID } from 'crypto';

const CreateSchema = v.object({
  pageId:   v.pipe(v.string(), v.minLength(1)),
  quote:    v.string(),
  text:     v.pipe(v.string(), v.minLength(1)),
  userName: v.optional(v.string())
});

const onInvalid = (result: any, c: any) => {
  if (!result.success) return c.json({ error: 'Invalid input' }, 400);
};

export const commentRoutes = new Hono<HonoEnv>()

  .use('*', authMiddleware)

  .get('/', async (c) => {
    const pageId = c.req.query('pageId');
    if (!pageId) return c.json({ error: 'pageId required' }, 400);
    const db       = createDb(c.env.DATABASE_URL);
    const comments = await db
      .select()
      .from(pageComments)
      .where(and(eq(pageComments.pageId, pageId), eq(pageComments.resolved, false)))
      .orderBy(pageComments.createdAt);
    return c.json({ comments });
  })

  .post('/', vValidator('json', CreateSchema, onInvalid), async (c) => {
    const userId = c.var.userId;
    const { pageId, quote, text, userName } = c.req.valid('json');
    const db  = createDb(c.env.DATABASE_URL);
    const now = new Date();
    const [comment] = await db
      .insert(pageComments)
      .values({
        id:        randomUUID(),
        pageId,
        userId,
        userName:  userName ?? c.var.userEmail,
        quote,
        text,
        resolved:  false,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return c.json({ comment }, 201);
  })

  .patch('/:id/resolve', async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const [comment] = await db
      .update(pageComments)
      .set({ resolved: true, updatedAt: new Date() })
      .where(eq(pageComments.id, c.req.param('id')))
      .returning();
    if (!comment) return c.json({ error: 'Not found' }, 404);
    return c.json({ comment });
  })

  .delete('/:id', async (c) => {
    const userId  = c.var.userId;
    const db      = createDb(c.env.DATABASE_URL);
    const [deleted] = await db
      .delete(pageComments)
      .where(and(eq(pageComments.id, c.req.param('id')), eq(pageComments.userId, userId)))
      .returning();
    if (!deleted) return c.json({ error: 'Not found or forbidden' }, 404);
    return c.json({ deleted: true });
  });
