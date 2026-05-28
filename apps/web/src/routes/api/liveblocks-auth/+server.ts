import { getEnv } from '$lib/server/env';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request, cookies, platform }: RequestEvent) {
  const sessionToken = cookies.get('better-auth.session_token');
  if (!sessionToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const LIVEBLOCKS_SECRET_KEY = process.env.LIVEBLOCKS_SECRET_KEY ?? '';
  if (!LIVEBLOCKS_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Liveblocks not configured' }), { status: 500 });
  }

  const AUTH_SERVICE_URL = getEnv(platform, 'AUTH_SERVICE_URL') || 'http://localhost:8083';

  let user: { id: string; email: string; name?: string | null } | null = null;
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/get-session`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const data = (await res.json()) as {
      user?: { id: string; email: string; name?: string | null };
      session?: { id: string };
    };
    if (!data.user || !data.session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    user = data.user;
  } catch {
    return new Response(JSON.stringify({ error: 'Auth service unreachable' }), { status: 503 });
  }

  const body = await request.json().catch(() => ({})) as { room?: string };
  const room = body.room;
  if (!room) {
    return new Response(JSON.stringify({ error: 'Missing room' }), { status: 400 });
  }

  const lbRes = await fetch('https://api.liveblocks.io/v2/identify-user', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LIVEBLOCKS_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: user.id,
      userInfo: {
        name: user.name ?? user.email,
        email: user.email,
      },
    }),
  });

  const lbBody = await lbRes.text();
  return new Response(lbBody, {
    status: lbRes.status,
    headers: { 'content-type': 'application/json' },
  });
}
