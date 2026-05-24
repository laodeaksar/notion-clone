import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie } from 'hono/cookie';

type Bindings = {
  JWT_SECRET: string;
  PAGE_SERVICE_URL: string;
  AUTH_SERVICE_URL: string;
  BLOCK_SERVICE_URL: string;
  FILE_SERVICE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

function getEnv(c: { env?: Partial<Bindings> }, key: keyof Bindings, fallback: string): string {
  const fromBinding = c.env?.[key];
  if (fromBinding) return fromBinding;
  if (typeof process !== 'undefined' && process.env[key]) return process.env[key] as string;
  return fallback;
}

async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const sig = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = sig + '='.repeat((4 - (sig.length % 4)) % 4);
    const signature = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));

    const valid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!valid) return null;

    const padPayload = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(padPayload + '='.repeat((4 - (padPayload.length % 4)) % 4)));
    if (payload.exp && payload.exp < Date.now() / 1000) return null;

    return payload;
  } catch {
    return null;
  }
}

async function extractToken(c: { req: { header: (k: string) => string | undefined; raw: Request } }): Promise<string | null> {
  const auth = c.req.header('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const cookieHeader = c.req.header('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

app.get('/health', (c) => c.json({ status: 'ok', service: 'api-gateway' }));

app.post('/auth/register', async (c) => {
  const authServiceUrl = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');
  const res = await fetch(`${authServiceUrl}/register`, {
    method: 'POST',
    body: await c.req.text(),
    headers: { 'content-type': 'application/json' }
  });
  return c.json(await res.json(), res.status as any);
});

app.post('/auth/login', async (c) => {
  const authServiceUrl = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');
  const res = await fetch(`${authServiceUrl}/login`, {
    method: 'POST',
    body: await c.req.text(),
    headers: { 'content-type': 'application/json' }
  });
  const json: any = await res.json();
  if (res.ok && json.token) {
    c.header('set-cookie', `token=${json.token}; HttpOnly; Path=/; SameSite=Lax`);
  }
  return c.json(json, res.status as any);
});

app.get('/me', async (c) => {
  const secret = getEnv(c, 'JWT_SECRET', 'dev-secret');
  const token = await extractToken(c as any);
  if (!token) return c.text('Unauthorized', 401);
  const payload = await verifyJWT(token, secret);
  if (!payload) return c.text('Unauthorized', 401);
  return c.json({ user: payload });
});

app.get('/pages', async (c) => {
  const pageServiceUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const parentId = c.req.query('parentId');
  const url = new URL(`${pageServiceUrl}/pages`);
  if (parentId) url.searchParams.set('parentId', parentId);
  const res = await fetch(url.toString());
  return c.json(await res.json(), res.status as any);
});

app.post('/pages', async (c) => {
  const secret = getEnv(c, 'JWT_SECRET', 'dev-secret');
  const pageServiceUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const token = await extractToken(c as any);
  const payload = token ? await verifyJWT(token, secret) : null;
  if (!payload) return c.text('Unauthorized', 401);
  const res = await fetch(`${pageServiceUrl}/pages`, {
    method: 'POST',
    body: await c.req.text(),
    headers: { 'content-type': 'application/json' }
  });
  return c.json(await res.json(), res.status as any);
});

app.get('/pages/:id', async (c) => {
  const pageServiceUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const blockServiceUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const include = c.req.query('include');
  const pageRes = await fetch(`${pageServiceUrl}/pages/${c.req.param('id')}`);
  const page: any = await pageRes.json();
  if (!pageRes.ok) return c.json(page, pageRes.status as any);
  if (include === 'blocks') {
    const blockRes = await fetch(`${blockServiceUrl}/blocks?pageId=${c.req.param('id')}`);
    const blocks = await blockRes.json();
    return c.json({ ...page, blocks }, 200);
  }
  return c.json(page, 200);
});

app.put('/pages/:id', async (c) => {
  const secret = getEnv(c, 'JWT_SECRET', 'dev-secret');
  const pageServiceUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const token = await extractToken(c as any);
  const payload = token ? await verifyJWT(token, secret) : null;
  if (!payload) return c.text('Unauthorized', 401);
  const res = await fetch(`${pageServiceUrl}/pages/${c.req.param('id')}`, {
    method: 'PUT',
    body: await c.req.text(),
    headers: { 'content-type': 'application/json' }
  });
  return c.json(await res.json(), res.status as any);
});

app.delete('/pages/:id', async (c) => {
  const secret = getEnv(c, 'JWT_SECRET', 'dev-secret');
  const pageServiceUrl = getEnv(c, 'PAGE_SERVICE_URL', 'http://localhost:8082');
  const token = await extractToken(c as any);
  const payload = token ? await verifyJWT(token, secret) : null;
  if (!payload) return c.text('Unauthorized', 401);
  const res = await fetch(`${pageServiceUrl}/pages/${c.req.param('id')}`, {
    method: 'DELETE'
  });
  return c.json(await res.json(), res.status as any);
});

app.get('/pages/:id/blocks', async (c) => {
  const blockServiceUrl = getEnv(c, 'BLOCK_SERVICE_URL', 'http://localhost:8081');
  const res = await fetch(`${blockServiceUrl}/blocks?pageId=${c.req.param('id')}`);
  return c.json(await res.json(), res.status as any);
});

app.post('/upload', async (c) => {
  const fileServiceUrl = getEnv(c, 'FILE_SERVICE_URL', 'http://localhost:8084');
  const res = await fetch(`${fileServiceUrl}/upload`, {
    method: 'POST',
    body: await c.req.text(),
    headers: { 'content-type': 'application/json' }
  });
  return c.json(await res.json(), res.status as any);
});

app.all('*', (c) => c.json({ error: 'not found' }, 404));

export default app;

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  app.fire();
}
