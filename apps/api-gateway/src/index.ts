import { Hono } from 'hono';
import { cors } from 'hono/cors';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const app = new Hono();
app.use('*', cors());

const rateMap = new Map<string, { count: number; until: number }>();
function rateLimit(ip: string) {
  const now = Date.now();
  const entry = rateMap.get(ip) ?? { count: 0, until: now + 60_000 };
  if (now > entry.until) entry.count = 0;
  entry.count++;
  rateMap.set(ip, entry);
  return entry.count <= 100;
}

app.use('*', async (c, next) => {
  const ip = c.req.headers.get('x-forwarded-for') || c.req.headers.get('host') || 'unknown';
  if (!rateLimit(String(ip))) return c.text('Rate limit', 429);
  return next();
});

const pageServiceUrl = process.env.PAGE_SERVICE_URL || 'http://localhost:8082';
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8083';
const blockServiceUrl = process.env.BLOCK_SERVICE_URL || 'http://localhost:8081';
const fileServiceUrl = process.env.FILE_SERVICE_URL || 'http://localhost:8084';

const verifyToken = (c: any) => {
  const auth = c.req.headers.get('authorization');
  let token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    const cookies = c.req.headers.get('cookie') ?? '';
    token = cookie.parse(cookies).token ?? null;
  }
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
  } catch {
    return null;
  }
};

const requireAuth = (c: any) => {
  const payload = verifyToken(c);
  if (!payload) return c.text('Unauthorized', 401);
  return payload;
};

app.get('/health', (c) => c.json({ status: 'ok', service: 'api-gateway' }));

app.post('/auth/register', async (c) => {
  const res = await fetch(`${authServiceUrl}/register`, {
    method: 'POST',
    body: await c.req.text(),
    headers: { 'content-type': 'application/json' }
  });
  return c.json(await res.json(), res.status);
});

app.post('/auth/login', async (c) => {
  const res = await fetch(`${authServiceUrl}/login`, {
    method: 'POST',
    body: await c.req.text(),
    headers: { 'content-type': 'application/json' }
  });
  const json = await res.json();
  if (res.ok && json.token) {
    c.header('set-cookie', `token=${json.token}; HttpOnly; Path=/; SameSite=Lax`);
  }
  return c.json(json, res.status);
});

app.get('/me', (c) => {
  const payload = verifyToken(c);
  if (!payload) return c.text('Unauthorized', 401);
  return c.json({ user: payload });
});

app.get('/pages', async (c) => {
  const parentId = c.req.query('parentId');
  const url = new URL(`${pageServiceUrl}/pages`);
  if (parentId) url.searchParams.set('parentId', parentId);
  const res = await fetch(url.toString());
  return c.json(await res.json(), res.status);
});

app.post('/pages', async (c) => {
  requireAuth(c);
  const res = await fetch(`${pageServiceUrl}/pages`, {
    method: 'POST',
    body: await c.req.text(),
    headers: { 'content-type': 'application/json' }
  });
  return c.json(await res.json(), res.status);
});

app.get('/pages/:id', async (c) => {
  const include = c.req.query('include');
  const pageRes = await fetch(`${pageServiceUrl}/pages/${c.req.param('id')}`);
  const page = await pageRes.json();
  if (!pageRes.ok) return c.json(page, pageRes.status);

  if (include === 'blocks') {
    const blockRes = await fetch(`${blockServiceUrl}/blocks?pageId=${c.req.param('id')}`);
    const blocks = await blockRes.json();
    return c.json({ ...page, blocks }, 200);
  }

  return c.json(page, 200);
});

app.put('/pages/:id', async (c) => {
  requireAuth(c);
  const res = await fetch(`${pageServiceUrl}/pages/${c.req.param('id')}`, {
    method: 'PUT',
    body: await c.req.text(),
    headers: { 'content-type': 'application/json' }
  });
  return c.json(await res.json(), res.status);
});

app.delete('/pages/:id', async (c) => {
  requireAuth(c);
  const res = await fetch(`${pageServiceUrl}/pages/${c.req.param('id')}`, {
    method: 'DELETE'
  });
  return c.json(await res.json(), res.status);
});

app.get('/pages/:id/blocks', async (c) => {
  const res = await fetch(`${blockServiceUrl}/blocks?pageId=${c.req.param('id')}`);
  return c.json(await res.json(), res.status);
});

app.post('/upload', async (c) => {
  const res = await fetch(`${fileServiceUrl}/upload`, {
    method: 'POST',
    body: await c.req.text(),
    headers: { 'content-type': 'application/json' }
  });
  return c.json(await res.json(), res.status);
});

app.all('*', (c) => c.json({ error: 'not found' }));

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  app.fire();
}

export default app;
