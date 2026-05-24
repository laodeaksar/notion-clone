import { Hono } from 'hono';
import * as v from 'valibot';
import type { Bindings } from '../types/gateway.types';
import { UploadBodySchema } from '../types/gateway.types';
import { getEnv } from '../config';
import { proxyJson } from '../services/proxy.service';

export const filesRoutes = new Hono<{ Bindings: Bindings }>();

filesRoutes.post('/upload', async (c) => {
  const body = await c.req.json();
  const result = v.safeParse(UploadBodySchema, body);
  if (!result.success) {
    return c.json({ error: 'Invalid input', issues: result.issues }, 400);
  }

  const fileUrl = getEnv(c, 'FILE_SERVICE_URL', 'http://localhost:8084');
  const { data, status } = await proxyJson(fileUrl, '/upload', {
    method: 'POST',
    body: JSON.stringify(result.output),
    headers: { 'content-type': 'application/json' }
  });
  return c.json(data, status as any);
});
