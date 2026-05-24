import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import type { Bindings } from '../types/gateway.types';
import { UploadBodySchema } from '../types/gateway.types';
import { getEnv } from '../config';
import { proxyJson } from '../services/proxy.service';

const validationError = (result: any, c: any) => {
  if (!result.success) {
    return c.json({ error: 'Invalid input', issues: result.issues }, 400);
  }
};

export const filesRoutes = new Hono<{ Bindings: Bindings }>();

filesRoutes.post(
  '/upload',
  vValidator('json', UploadBodySchema, validationError),
  async (c) => {
    const body = c.req.valid('json');
    const fileUrl = getEnv(c, 'FILE_SERVICE_URL', 'http://localhost:8084');
    const { data, status } = await proxyJson(fileUrl, '/upload', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' }
    });
    return c.json(data, status as any);
  }
);
