import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import { UploadInputSchema } from '../types/file.types';
import { createFileService } from '../services/file.service';
import { authMiddleware } from '../middleware/auth';
import type { HonoEnv } from '../types/env';

export const fileRoutes = new Hono<HonoEnv>()

  .use('*', authMiddleware)

  .post('/', vValidator('json', UploadInputSchema), async (c) => {
    const svc = createFileService(c.env.R2_BUCKET, c.env.R2_PUBLIC_URL);
    try {
      const result = await svc.upload(c.req.valid('json'));
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: err.message ?? 'Upload failed' }, 400);
    }
  });
