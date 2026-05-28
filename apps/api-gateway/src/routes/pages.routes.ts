import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import type { HonoEnv } from '../types/gateway.types';
import { PageBodySchema, PageUpdateBodySchema } from '../types/gateway.types';
import { getEnv } from '../config';
import { proxyJson } from '../services/proxy.service';
import { requireAuth } from '../middleware/auth';
import { serviceHeaders } from '../lib/headers';

const onInvalid = (result: any, c: any) => {
  if (!result.success) {
    return c.json({ error: 'Invalid input', issues: result.issues }, 400);
  }
};

export const pageRoutes = new Hono<HonoEnv>();

pageRoutes.get('/pages', requireAuth, async (c) => {
  const pageUrl  = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const parentId = c.req.query('parentId');
  const { data, status } = await proxyJson(pageUrl, '/pages', {
    query:   { parentId },
    headers: serviceHeaders(c)
  });
  return c.json(data, status as any);
});

pageRoutes.post(
  '/pages',
  requireAuth,
  vValidator('json', PageBodySchema, onInvalid),
  async (c) => {
    const body    = c.req.valid('json');
    const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
    const { data, status } = await proxyJson(pageUrl, '/pages', {
      method:  'POST',
      body:    JSON.stringify(body),
      headers: { 'content-type': 'application/json', ...serviceHeaders(c) }
    });
    return c.json(data, status as any);
  }
);

pageRoutes.get('/pages/:id', requireAuth, async (c) => {
  const pageUrl  = getEnv(c, 'PAGE_SERVICE_URL',  'http://localhost:8082');
  const blockUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const include  = c.req.query('include');
  const id       = c.req.param('id');
  const headers  = serviceHeaders(c);

  const { data: page, status } = await proxyJson<Record<string, unknown>>(
    pageUrl, `/pages/${id}`, { headers }
  );
  if (status !== 200) return c.json(page, status as any);

  if (include === 'blocks') {
    const { data: blocks } = await proxyJson(blockUrl, '/blocks', {
      query: { pageId: id },
      headers
    });
    return c.json({ ...page, blocks }, 200);
  }
  return c.json(page, 200);
});

pageRoutes.get('/pages/:id/ancestors', requireAuth, async (c) => {
  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const { data, status } = await proxyJson(
    pageUrl, `/pages/${c.req.param('id')}/ancestors`,
    { headers: serviceHeaders(c) }
  );
  return c.json(data, status as any);
});

pageRoutes.put(
  '/pages/:id',
  requireAuth,
  vValidator('json', PageUpdateBodySchema, onInvalid),
  async (c) => {
    const body    = c.req.valid('json');
    const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
    const { data, status } = await proxyJson(pageUrl, `/pages/${c.req.param('id')}`, {
      method:  'PUT',
      body:    JSON.stringify(body),
      headers: { 'content-type': 'application/json', ...serviceHeaders(c) }
    });
    return c.json(data, status as any);
  }
);

pageRoutes.delete('/pages/:id', requireAuth, async (c) => {
  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const { data, status } = await proxyJson(pageUrl, `/pages/${c.req.param('id')}`, {
    method:  'DELETE',
    headers: serviceHeaders(c)
  });
  return c.json(data, status as any);
});

pageRoutes.get('/pages/:id/blocks', requireAuth, async (c) => {
  const blockUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const { data, status } = await proxyJson(blockUrl, '/blocks', {
    query:   { pageId: c.req.param('id') },
    headers: serviceHeaders(c)
  });
  return c.json(data, status as any);
});

// ─── Block CRUD ───────────────────────────────────────────────────────────────

pageRoutes.post('/blocks', requireAuth, async (c) => {
  const blockUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const body     = await c.req.arrayBuffer();
  const { data, status } = await proxyJson(blockUrl, '/blocks', {
    method:  'POST',
    body:    Buffer.from(body).toString('utf-8'),
    headers: { 'content-type': 'application/json', ...serviceHeaders(c) }
  });
  return c.json(data, status as any);
});

pageRoutes.get('/blocks/:id', requireAuth, async (c) => {
  const blockUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const { data, status } = await proxyJson(blockUrl, `/blocks/${c.req.param('id')}`, {
    headers: serviceHeaders(c)
  });
  return c.json(data, status as any);
});

pageRoutes.put('/blocks/:id', requireAuth, async (c) => {
  const blockUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const body     = await c.req.arrayBuffer();
  const { data, status } = await proxyJson(blockUrl, `/blocks/${c.req.param('id')}`, {
    method:  'PUT',
    body:    Buffer.from(body).toString('utf-8'),
    headers: { 'content-type': 'application/json', ...serviceHeaders(c) }
  });
  return c.json(data, status as any);
});

pageRoutes.delete('/blocks/:id', requireAuth, async (c) => {
  const blockUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const { data, status } = await proxyJson(blockUrl, `/blocks/${c.req.param('id')}`, {
    method:  'DELETE',
    headers: serviceHeaders(c)
  });
  return c.json(data, status as any);
});

// ─── Comments ─────────────────────────────────────────────────────────────────

pageRoutes.get('/comments', requireAuth, async (c) => {
  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const pageId  = c.req.query('pageId');
  const { data, status } = await proxyJson(pageUrl, '/comments', {
    query:   { pageId },
    headers: serviceHeaders(c)
  });
  return c.json(data, status as any);
});

pageRoutes.post('/comments', requireAuth, async (c) => {
  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const body    = await c.req.arrayBuffer();
  const { data, status } = await proxyJson(pageUrl, '/comments', {
    method:  'POST',
    body:    Buffer.from(body).toString('utf-8'),
    headers: { 'content-type': 'application/json', ...serviceHeaders(c) }
  });
  return c.json(data, status as any);
});

pageRoutes.patch('/comments/:id/resolve', requireAuth, async (c) => {
  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const { data, status } = await proxyJson(pageUrl, `/comments/${c.req.param('id')}/resolve`, {
    method:  'PATCH',
    headers: serviceHeaders(c)
  });
  return c.json(data, status as any);
});

pageRoutes.delete('/comments/:id', requireAuth, async (c) => {
  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const { data, status } = await proxyJson(pageUrl, `/comments/${c.req.param('id')}`, {
    method:  'DELETE',
    headers: serviceHeaders(c)
  });
  return c.json(data, status as any);
});
