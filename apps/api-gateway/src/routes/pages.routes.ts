import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import type { Bindings } from '../types/gateway.types';
import { PageBodySchema } from '../types/gateway.types';
import { getEnv } from '../config';
import { verifyJWT, extractToken } from '../lib/jwt';
import { proxyJson } from '../services/proxy.service';

const validationError = (result: any, c: any) => {
  if (!result.success) {
    return c.json({ error: 'Invalid input', issues: result.issues }, 400);
  }
};

async function requireAuth(c: any): Promise<Record<string, unknown> | null> {
  const secret = getEnv(c, 'JWT_SECRET', 'dev-secret');
  const token = await extractToken(c);
  return token ? verifyJWT(token, secret) : null;
}

export const pagesRoutes = new Hono<{ Bindings: Bindings }>();

pagesRoutes.get('/pages', async (c) => {
  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const parentId = c.req.query('parentId');
  const { data, status } = await proxyJson(pageUrl, '/pages', {
    query: { parentId }
  });
  return c.json(data, status as any);
});

pagesRoutes.post(
  '/pages',
  vValidator('json', PageBodySchema, validationError),
  async (c) => {
    const payload = await requireAuth(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
    const { data, status } = await proxyJson(pageUrl, '/pages', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' }
    });
    return c.json(data, status as any);
  }
);

pagesRoutes.get('/pages/:id', async (c) => {
  const pageUrl  = getEnv(c, 'PAGE_SERVICE_URL',  'http://localhost:8082');
  const blockUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const include  = c.req.query('include');
  const id       = c.req.param('id');

  const { data: page, status } = await proxyJson<Record<string, unknown>>(
    pageUrl, `/pages/${id}`
  );
  if (status !== 200) return c.json(page, status as any);

  if (include === 'blocks') {
    const { data: blocks } = await proxyJson(blockUrl, '/blocks', {
      query: { pageId: id }
    });
    return c.json({ ...page, blocks }, 200);
  }
  return c.json(page, 200);
});

pagesRoutes.put(
  '/pages/:id',
  vValidator('json', PageBodySchema, validationError),
  async (c) => {
    const payload = await requireAuth(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
    const { data, status } = await proxyJson(pageUrl, `/pages/${c.req.param('id')}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' }
    });
    return c.json(data, status as any);
  }
);

pagesRoutes.delete('/pages/:id', async (c) => {
  const payload = await requireAuth(c);
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);

  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const { data, status } = await proxyJson(pageUrl, `/pages/${c.req.param('id')}`, {
    method: 'DELETE'
  });
  return c.json(data, status as any);
});

pagesRoutes.get('/pages/:id/blocks', async (c) => {
  const blockUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const { data, status } = await proxyJson(blockUrl, '/blocks', {
    query: { pageId: c.req.param('id') }
  });
  return c.json(data, status as any);
});
