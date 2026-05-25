import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import { UploadInputSchema } from '../types/file.types';
import { createFileService } from '../services/file.service';
import { authMiddleware } from '../middleware/auth';
import type { HonoEnv } from '../types/env';

export const fileRoutes = new Hono<HonoEnv>()

  .use('*', authMiddleware)

  .get('/', async (c) => {
    const folder = c.req.query('folder') ?? undefined;
    const cursor = c.req.query('cursor') ?? undefined;
    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Math.max(parseInt(limitRaw, 10) || 100, 1), 1000) : 100;
    const svc = createFileService(c.env.R2_BUCKET, c.env.R2_PUBLIC_URL);
    try {
      const result = await svc.list(folder, cursor, limit);
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: err.message ?? 'List failed' }, 400);
    }
  })

  .post('/', vValidator('json', UploadInputSchema), async (c) => {
    const svc = createFileService(c.env.R2_BUCKET, c.env.R2_PUBLIC_URL);
    try {
      const result = await svc.upload(c.req.valid('json'));
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: err.message ?? 'Upload failed' }, 400);
    }
  })

  .get('/:publicId{.+}', async (c) => {
    const publicId = c.req.param('publicId');
    const svc = createFileService(c.env.R2_BUCKET, c.env.R2_PUBLIC_URL);
    try {
      const result = await svc.head(publicId);
      return c.json(result);
    } catch (err: any) {
      const isNotFound = err.message?.includes('not found');
      return c.json({ error: err.message ?? 'Not found' }, isNotFound ? 404 : 400);
    }
  })

  .delete('/:publicId{.+}', async (c) => {
    const publicId = c.req.param('publicId');
    const svc = createFileService(c.env.R2_BUCKET, c.env.R2_PUBLIC_URL);
    try {
      const result = await svc.delete(publicId);
      return c.json(result);
    } catch (err: any) {
      const isNotFound = err.message?.includes('not found');
      return c.json({ error: err.message ?? 'Delete failed' }, isNotFound ? 404 : 400);
    }
  });
