import { Hono } from 'hono';
import { cors } from 'hono/cors';
import jsYaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ─── OpenAPI spec ─────────────────────────────────────────────────────────────
// Loaded once at startup.
// Bun / Node: reads openapi.yaml from disk via node:fs.
// Cloudflare Workers: file-system access is unavailable; spec is served as an
// empty stub unless bundled as a Text module (see wrangler.toml [[rules]]).
let openapiSpec: object = {};
try {
  const dir = dirname(fileURLToPath(import.meta.url));
  const yaml = readFileSync(join(dir, '../openapi.yaml'), 'utf-8');
  openapiSpec = jsYaml.load(yaml) as object;
} catch {
  // Workers environment — spec unavailable at runtime (see wrangler.toml)
}

// ─── Types ──────────────────────────────────────────────────────────────────

type Bindings = {
  JWT_SECRET: string;
  PAGE_SERVICE_URL: string;
  AUTH_SERVICE_URL: string;
  BLOCK_SERVICE_URL: string;
  FILE_SERVICE_URL: string;
  RATE_LIMIT_KV: KVNamespace; // Cloudflare KV namespace (optional in local dev)
};

type RateLimitEntry = { count: number; until: number };

type RateLimitResult = {
  allowed:   boolean;
  remaining: number;
  resetAt:   number; // Unix timestamp in seconds
};

// ─── Rate Limiting ───────────────────────────────────────────────────────────

const RATE_LIMIT_MAX    = 100; // max requests per window
const RATE_LIMIT_WINDOW = 60;  // window size in seconds

// In-memory fallback for local Bun development (not shared across instances)
const localRateMap = new Map<string, RateLimitEntry>();

async function checkRateLimit(ip: string, kv?: KVNamespace): Promise<RateLimitResult> {
  const now = Date.now();
  let entry: RateLimitEntry;

  if (kv) {
    // ── Cloudflare KV (persistent, shared across all Workers instances) ──
    const key = `rl:${ip}`;
    const raw = await kv.get(key);
    entry = raw ? JSON.parse(raw) : { count: 0, until: now + RATE_LIMIT_WINDOW * 1000 };

    if (now > entry.until) {
      entry.count = 0;
      entry.until = now + RATE_LIMIT_WINDOW * 1000;
    }
    entry.count++;

    // expirationTtl auto-expires the key — no stale entries accumulate in KV
    const ttlSeconds = Math.max(1, Math.ceil((entry.until - now) / 1000));
    await kv.put(key, JSON.stringify(entry), { expirationTtl: ttlSeconds });
  } else {
    // ── In-memory fallback for local Bun dev ──
    entry = localRateMap.get(ip) ?? { count: 0, until: now + RATE_LIMIT_WINDOW * 1000 };
    if (now > entry.until) {
      entry.count = 0;
      entry.until = now + RATE_LIMIT_WINDOW * 1000;
    }
    entry.count++;
    localRateMap.set(ip, entry);
  }

  return {
    allowed:   entry.count <= RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetAt:   Math.ceil(entry.until / 1000),
  };
}

// Read current quota state WITHOUT incrementing the counter
async function peekRateLimit(
  ip: string,
  kv?: KVNamespace
): Promise<{ used: number; remaining: number; resetAt: number }> {
  const now = Date.now();
  let entry: RateLimitEntry | null = null;

  if (kv) {
    const raw = await kv.get(`rl:${ip}`);
    entry = raw ? JSON.parse(raw) : null;
  } else {
    entry = localRateMap.get(ip) ?? null;
  }

  // No record yet — treat as a fresh window with full quota
  if (!entry || now > entry.until) {
    return {
      used:      0,
      remaining: RATE_LIMIT_MAX,
      resetAt:   Math.ceil((now + RATE_LIMIT_WINDOW * 1000) / 1000),
    };
  }

  return {
    used:      entry.count,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetAt:   Math.ceil(entry.until / 1000),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEnv(c: { env?: Partial<Bindings> }, key: Exclude<keyof Bindings, 'RATE_LIMIT_KV'>, fallback: string): string {
  const fromBinding = c.env?.[key];
  if (fromBinding) return fromBinding as string;
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
    const signature = Uint8Array.from(atob(padded), (ch) => ch.charCodeAt(0));

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

async function extractToken(c: { req: { header: (k: string) => string | undefined } }): Promise<string | null> {
  const auth = c.req.header('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const cookieHeader = c.req.header('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

// ─── App ─────────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Rate limit middleware — uses KV in Cloudflare Workers, in-memory locally
app.use('*', async (c, next) => {
  // cf-connecting-ip is set by Cloudflare and cannot be spoofed
  // These endpoints are exempt from rate limiting
  const exemptPaths = ['/rate-limit/status', '/docs', '/openapi.json', '/health'];
  if (exemptPaths.includes(c.req.path)) return next();

  const ip =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown';

  const kv = (c.env as Partial<Bindings>)?.RATE_LIMIT_KV;
  const { allowed, remaining, resetAt } = await checkRateLimit(ip, kv);

  // Always attach rate limit headers so clients can track their quota
  c.header('X-RateLimit-Limit',     String(RATE_LIMIT_MAX));
  c.header('X-RateLimit-Remaining', String(remaining));
  c.header('X-RateLimit-Reset',     String(resetAt));

  if (!allowed) {
    return c.json({ error: 'Too many requests', retryAfter: resetAt }, 429);
  }
  return next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', service: 'api-gateway' }));

// ─── Docs ─────────────────────────────────────────────────────────────────────

// Serve the parsed OpenAPI spec as JSON (consumed by Swagger UI)
app.get('/openapi.json', (c) => c.json(openapiSpec));

// Interactive Swagger UI — not rate-limited, no auth required
//
// Key behaviours:
//  • Fetches /openapi.json then OVERRIDES spec.servers with window.location.origin
//    so "Try it out" works from any host — localhost, wrangler dev, or Replit proxy.
//  • persistAuthorization — JWT entered once survives page reloads.
//  • displayRequestDuration — shows latency on every response.
//  • filter — search box across all operations.
app.get('/docs', (c) =>
  c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Notion Clone API</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; }
      .swagger-ui .topbar { background-color: #1e1e2e; }
      .swagger-ui .topbar-wrapper img { content: none; }
      .swagger-ui .topbar-wrapper::before {
        content: "Notion Clone API";
        color: #cdd6f4;
        font-size: 1.1rem;
        font-weight: 600;
        padding-left: 1rem;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin="anonymous"></script>
    <script>
      window.onload = async () => {
        // Fetch spec and rewrite servers[] so every "Try it out" request
        // goes to THIS host — works on localhost, wrangler dev, and Replit proxy.
        const spec = await fetch('/openapi.json').then(r => r.json());
        spec.servers = [{ url: window.location.origin, description: 'Current server' }];

        window.ui = SwaggerUIBundle({
          spec,
          dom_id: '#swagger-ui',
          deepLinking: true,
          persistAuthorization: true,
          displayRequestDuration: true,
          tryItOutEnabled: true,
          filter: true,
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 2,
        });
      };
    </script>
  </body>
</html>`)
);

// Returns current quota for the caller's IP — does NOT consume a slot
app.get('/rate-limit/status', async (c) => {
  const ip =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown';

  const kv = (c.env as Partial<Bindings>)?.RATE_LIMIT_KV;
  const { used, remaining, resetAt } = await peekRateLimit(ip, kv);
  const now = Math.ceil(Date.now() / 1000);

  return c.json({
    ip,
    limit:    RATE_LIMIT_MAX,
    used,
    remaining,
    resetAt,
    resetsIn: Math.max(0, resetAt - now),  // seconds until window resets
    window:   RATE_LIMIT_WINDOW,
  });
});

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
  const pageServiceUrl  = getEnv(c, 'PAGE_SERVICE_URL',  'http://localhost:8082');
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

// ─── Entrypoints ─────────────────────────────────────────────────────────────

// Cloudflare Workers: uses this export as the fetch handler
export default app;

// Bun local dev: app.fire() reads PORT from process.env and starts the server
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  app.fire();
}
