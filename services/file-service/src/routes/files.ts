import { Hono } from 'hono';
import * as v from 'valibot';
import { UploadInputSchema, MoveInputSchema } from '../types/file.types';
import { createFileService } from '../services/file.service';
import { createDb } from '@workspace/db';
import { authMiddleware } from '../middleware/auth';
import type { HonoEnv } from '../types/env';

export const fileRoutes = new Hono<HonoEnv>()

  .use('*', authMiddleware)

  .get('/', async (c) => {
    const folder   = c.req.query('folder') ?? undefined;
    const cursor   = c.req.query('cursor') ?? undefined;
    const limitRaw = c.req.query('limit');
    const limit    = limitRaw ? Math.min(Math.max(parseInt(limitRaw, 10) || 100, 1), 1000) : 100;
    const db       = c.env.DATABASE_URL ? createDb(c.env.DATABASE_URL) : null;
    const svc      = createFileService(c.env.R2_BUCKET, c.env.R2_PUBLIC_URL, db);
    try {
      const result = await svc.list(folder, cursor, limit);
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: err.message ?? 'List failed' }, 400);
    }
  })

  .post('/', async (c) => {
    const db          = c.env.DATABASE_URL ? createDb(c.env.DATABASE_URL) : null;
    const svc         = createFileService(c.env.R2_BUCKET, c.env.R2_PUBLIC_URL, db);
    const contentType = c.req.header('Content-Type') ?? '';
    const uploadedBy  = c.get('userId');

    try {
      if (contentType.includes('multipart/form-data')) {
        const form = await c.req.formData();
        const file = form.get('file');
        if (!file || !(file instanceof File)) {
          return c.json({ error: 'Missing "file" field in multipart body' }, 400);
        }
        const folder   = form.get('folder')?.toString() ?? undefined;
        const filename = form.get('filename')?.toString() ?? undefined;
        const result   = await svc.uploadFile(file, folder, filename, uploadedBy);
        return c.json(result);
      }

      const body   = await c.req.json().catch(() => null);
      const parsed = v.safeParse(UploadInputSchema, body);
      if (!parsed.success) {
        return c.json({ error: 'Invalid request body', issues: parsed.issues }, 400);
      }
      const result = await svc.upload(parsed.output, uploadedBy);
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: err.message ?? 'Upload failed' }, 400);
    }
  })

  .get('/:publicId{.+}', async (c) => {
    const publicId = c.req.param('publicId');
    const db       = c.env.DATABASE_URL ? createDb(c.env.DATABASE_URL) : null;
    const svc      = createFileService(c.env.R2_BUCKET, c.env.R2_PUBLIC_URL, db);
    try {
      const result = await svc.head(publicId);
      return c.json(result);
    } catch (err: any) {
      const isNotFound = err.message?.includes('not found');
      return c.json({ error: err.message ?? 'Not found' }, isNotFound ? 404 : 400);
    }
  })

  .patch('/:publicId{.+}', async (c) => {
    const publicId = c.req.param('publicId');
    const db       = c.env.DATABASE_URL ? createDb(c.env.DATABASE_URL) : null;
    const svc      = createFileService(c.env.R2_BUCKET, c.env.R2_PUBLIC_URL, db);
    try {
      const body   = await c.req.json().catch(() => null);
      const parsed = v.safeParse(MoveInputSchema, body);
      if (!parsed.success) {
        return c.json({ error: 'Invalid request body', issues: parsed.issues }, 400);
      }
      const result = await svc.move(publicId, parsed.output);
      return c.json(result);
    } catch (err: any) {
      const isNotFound = err.message?.includes('not found');
      return c.json({ error: err.message ?? 'Move failed' }, isNotFound ? 404 : 400);
    }
  })

  .delete('/:publicId{.+}', async (c) => {
    const publicId = c.req.param('publicId');
    const db       = c.env.DATABASE_URL ? createDb(c.env.DATABASE_URL) : null;
    const svc      = createFileService(c.env.R2_BUCKET, c.env.R2_PUBLIC_URL, db);
    try {
      const result = await svc.delete(publicId);
      return c.json(result);
    } catch (err: any) {
      const isNotFound = err.message?.includes('not found');
      return c.json({ error: err.message ?? 'Delete failed' }, isNotFound ? 404 : 400);
    }
  });
