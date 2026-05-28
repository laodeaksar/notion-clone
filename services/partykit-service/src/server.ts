import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { Liveblocks } from '@liveblocks/node';

const app = new Hono();

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ?? 'http://localhost:8083';

const LIVEBLOCKS_SECRET_KEY = process.env.LIVEBLOCKS_SECRET_KEY ?? '';

app.post('/liveblocks-auth', async (c) => {
  const token = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return c.json({ error: 'Unauthorized — no token' }, 401);
  }

  let user: { id: string; name?: string | null; email: string } | null = null;

  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/get-session`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return c.json({ error: 'Unauthorized — invalid session' }, 401);

    const data = (await res.json()) as {
      user?: { id: string; email: string; name?: string | null };
      session?: { id: string };
    };

    if (!data.user || !data.session) {
      return c.json({ error: 'Unauthorized — no active session' }, 401);
    }

    user = data.user;
  } catch {
    return c.json({ error: 'Unauthorized — auth service unreachable' }, 503);
  }

  const liveblocks = new Liveblocks({ secret: LIVEBLOCKS_SECRET_KEY });

  const body = await c.req.json().catch(() => ({}));
  const room = body.room as string | undefined;

  if (!room) {
    return c.json({ error: 'Missing room' }, 400);
  }

  const { status, body: lbBody } = await liveblocks.identifyUser(
    {
      userId: user.id,
      groupIds: [],
    },
    {
      userInfo: {
        name: user.name ?? user.email,
        email: user.email,
      },
    }
  );

  return new Response(lbBody, {
    status,
    headers: { 'content-type': 'application/json' },
  });
});

app.get('/health', (c) => c.json({ ok: true }));

const PORT = parseInt(process.env.PORT ?? '1999');
serve({ fetch: app.fetch, port: PORT });
console.log(`[liveblocks-service] listening on http://localhost:${PORT}`);
