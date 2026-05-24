import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import { PageInputSchema, PageUpdateSchema } from '../types/page.types';
import { createPageService } from '../services/page.service';
import { createDb } from '../config';
import { authMiddleware } from '../middleware/auth';
import type { HonoEnv } from '../types/env';

export const pageRoutes = new Hono<HonoEnv>()

  .use('*', authMiddleware)

  .get('/', async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const svc = createPageService(db);
    const parentId = c.req.query('parentId');
    const pages = await svc.getPages(parentId);
    return c.json({ pages });
  })

  .post('/', vValidator('json', PageInputSchema), async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const svc = createPageService(db);
    try {
      const page = await svc.createPage(c.req.valid('json'));
      return c.json({ page }, 201);
    } catch (err: any) {
      return c.json({ error: err.message ?? 'Invalid input' }, 400);
    }
  })

  .get('/:id', async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const svc = createPageService(db);
    const page = await svc.getPageById(c.req.param('id'));
    if (!page) return c.json({ error: 'Page not found' }, 404);
    return c.json({ page });
  })

  .put('/:id', vValidator('json', PageUpdateSchema), async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const svc = createPageService(db);
    try {
      const page = await svc.updatePage(c.req.param('id'), c.req.valid('json'));
      if (!page) return c.json({ error: 'Page not found' }, 404);
      return c.json({ page });
    } catch (err: any) {
      return c.json({ error: err.message ?? 'Invalid input' }, 400);
    }
  })

  .delete('/:id', async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const svc = createPageService(db);
    const deleted = await svc.deletePage(c.req.param('id'));
    if (!deleted) return c.json({ error: 'Page not found' }, 404);
    return c.json({ deleted: true });
  });
