import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import { UploadInputSchema } from '../types/file.types';
import { createFileService } from '../services/file.service';
import { authMiddleware } from '../middleware/auth';
import type { HonoEnv } from '../types/env';

export const fileRoutes = new Hono<HonoEnv>()

  .use('*', authMiddleware)

  .post('/', vValidator('json', UploadInputSchema), async (c) => {
    const svc = createFileService({
      cloudName: c.env.CLOUDINARY_CLOUD_NAME,
      apiKey: c.env.CLOUDINARY_API_KEY,
      apiSecret: c.env.CLOUDINARY_API_SECRET
    });
    try {
      const result = await svc.upload(c.req.valid('json'));
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: err.message ?? 'Upload failed' }, 400);
    }
  });
