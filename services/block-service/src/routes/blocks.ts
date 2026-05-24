import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import { BlockInputSchema, BlockUpdateSchema } from '../types/block.types';
import { createBlockService } from '../services/block.service';
import { createDb } from '../config';
import { authMiddleware } from '../middleware/auth';
import type { HonoEnv } from '../types/env';

export const blockRoutes = new Hono<HonoEnv>()

  .use('*', authMiddleware)

  .get('/', async (c) => {
    const pageId = c.req.query('pageId');
    if (!pageId) return c.json({ error: 'pageId is required' }, 400);
    const db = createDb(c.env.DATABASE_URL);
    const svc = createBlockService(db);
    const blocks = await svc.getBlocksByPage(pageId);
    return c.json({ blocks });
  })

  .get('/:id', async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const svc = createBlockService(db);
    const block = await svc.getBlockById(c.req.param('id'));
    if (!block) return c.json({ error: 'Block not found' }, 404);
    return c.json({ block });
  })

  .post('/', vValidator('json', BlockInputSchema), async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const svc = createBlockService(db);
    try {
      const block = await svc.createBlock(c.req.valid('json'));
      return c.json({ status: 'created', block }, 201);
    } catch (err: any) {
      return c.json({ error: err.message ?? 'Invalid input' }, 400);
    }
  })

  .put('/:id', vValidator('json', BlockUpdateSchema), async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const svc = createBlockService(db);
    try {
      const block = await svc.updateBlock(c.req.param('id'), c.req.valid('json'));
      if (!block) return c.json({ error: 'Block not found' }, 404);
      return c.json({ block });
    } catch (err: any) {
      return c.json({ error: err.message ?? 'Invalid input' }, 400);
    }
  })

  .delete('/:id', async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const svc = createBlockService(db);
    const deleted = await svc.deleteBlock(c.req.param('id'));
    if (!deleted) return c.json({ error: 'Block not found' }, 404);
    return c.json({ deleted: true });
  });
