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
 * authHeaders — builds the trusted identity headers the gateway injects into
 * every upstream request after session validation.
 *
 * Downstream services (page-service, block-service) trust these headers
 * unconditionally because only the gateway — after validating the better-auth
 * session — is allowed to set them.
 */
function authHeaders(c: Context<HonoEnv>): Record<string, string> {
  const p = c.var.jwtPayload as { sub?: string; email?: string } | undefined;
  const headers: Record<string, string> = {};
  if (p?.sub)   headers['x-user-id']    = p.sub;
  if (p?.email) headers['x-user-email'] = p.email;
  return headers;
}

export const pageRoutes = new Hono<HonoEnv>();

pageRoutes.get('/pages', requireAuth, async (c) => {
  const pageUrl  = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const parentId = c.req.query('parentId');
  const { data, status } = await proxyJson(pageUrl, '/pages', {
    query:   { parentId },
    headers: authHeaders(c)
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
      headers: { 'content-type': 'application/json', ...authHeaders(c) }
    });
    return c.json(data, status as any);
  }
);

pageRoutes.get('/pages/:id', requireAuth, async (c) => {
  const pageUrl  = getEnv(c, 'PAGE_SERVICE_URL',  'http://localhost:8082');
  const blockUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const include  = c.req.query('include');
  const id       = c.req.param('id');
  const auth     = authHeaders(c);

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
    { headers: authHeaders(c) }
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
      headers: { 'content-type': 'application/json', ...authHeaders(c) }
    });
    return c.json(data, status as any);
  }
);

pageRoutes.delete('/pages/:id', requireAuth, async (c) => {
  const pageUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const { data, status } = await proxyJson(pageUrl, `/pages/${c.req.param('id')}`, {
    method:  'DELETE',
    headers: authHeaders(c)
  });
  return c.json(data, status as any);
});

pageRoutes.get('/pages/:id/blocks', requireAuth, async (c) => {
  const blockUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const { data, status } = await proxyJson(blockUrl, '/blocks', {
    query:   { pageId: c.req.param('id') },
    headers: authHeaders(c)
  });
  return c.json(data, status as any);
});
