import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import type { Context } from 'hono';
import type { HonoEnv } from '../types/gateway.types';
import { PageBodySchema } from '../types/gateway.types';
import { getEnv } from '../config';
import { proxyJson } from '../services/proxy.service';
import { requireAuth } from '../middleware/auth';

const onInvalid = (result: any, c: any) => {
  if (!result.success) {
    return c.json({ error: 'Invalid input', issues: result.issues }, 400);
  }
};

/**
 * forwardAuth — returns the incoming Authorization header so the gateway can
 * pass it to upstream microservices verbatim. Each service re-verifies the
 * JWT independently rather than trusting the gateway's assertion.
 */
function forwardAuth(c: Context<HonoEnv>): Record<string, string> {
  const auth = c.req.header('authorization');
  return auth ? { Authorization: auth } : {};
}

export const pageRoutes = new Hono<HonoEnv>();

pageRoutes.get('/pages', requireAuth, async (c) => {
  const pageUrl  = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const parentId = c.req.query('parentId');
  const { data, status } = await proxyJson(pageUrl, '/pages', {
    query:   { parentId },
    headers: forwardAuth(c)
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
      headers: { 'content-type': 'application/json', ...forwardAuth(c) }
    });
    return c.json(data, status as any);
  }
);

pageRoutes.get('/pages/:id', requireAuth, async (c) => {
  const pageUrl  = getEnv(c, 'PAGE_SERVICE_URL',  'http://localhost:8082');
  const blockUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const include  = c.req.query('include');
  const id       = c.req.param('id');
  const auth     = forwardAuth(c);

  const { data: page, status } = await proxyJson<Record<string, unknown>>(
    pageUrl, `/pages/${id}`, { headers: auth }
  );
  if (status !== 200) return c.json(page, status as any);

  if (include === 'blocks') {
    const { data: blocks } = await proxyJson(blockUrl, '/blocks', {
      query:   { pageId: id },
      headers: auth
    });
    return c.json({ ...page, blocks }, 200);
  }
  return c.json(page, 200);
});

pageRoutes.get('/pages/:id/ancestors', requireAuth, async (c) => {
  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const { data, status } = await proxyJson(
    pageUrl, `/pages/${c.req.param('id')}/ancestors`,
    { headers: forwardAuth(c) }
  );
  return c.json(data, status as any);
});

pageRoutes.put(
  '/pages/:id',
  requireAuth,
  vValidator('json', PageBodySchema, onInvalid),
  async (c) => {
    const body    = c.req.valid('json');
    const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
    const { data, status } = await proxyJson(pageUrl, `/pages/${c.req.param('id')}`, {
      method:  'PUT',
      body:    JSON.stringify(body),
      headers: { 'content-type': 'application/json', ...forwardAuth(c) }
    });
    return c.json(data, status as any);
  }
);

pageRoutes.delete('/pages/:id', requireAuth, async (c) => {
  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const { data, status } = await proxyJson(pageUrl, `/pages/${c.req.param('id')}`, {
    method:  'DELETE',
    headers: forwardAuth(c)
  });
  return c.json(data, status as any);
});

pageRoutes.get('/pages/:id/blocks', requireAuth, async (c) => {
  const blockUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const { data, status } = await proxyJson(blockUrl, '/blocks', {
    query:   { pageId: c.req.param('id') },
    headers: forwardAuth(c)
  });
  return c.json(data, status as any);
});
