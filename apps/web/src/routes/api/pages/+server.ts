import { getEnv } from '$lib/server/env';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent) {
  const sessionToken = event.cookies.get('better-auth.session_token');
  if (!sessionToken) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const API_GATEWAY_URL = getEnv(event.platform, 'API_GATEWAY_URL');
  const res  = await fetch(`${API_GATEWAY_URL}/pages`, {
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
}

export async function POST(event: RequestEvent) {
  const sessionToken = event.cookies.get('better-auth.session_token');
  if (!sessionToken) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const API_GATEWAY_URL = getEnv(event.platform, 'API_GATEWAY_URL');
  const json = await event.request.json().catch(() => null);
  if (!json) return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 });

  const res  = await fetch(`${API_GATEWAY_URL}/pages`, {
    method:  'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${sessionToken}` },
    body:    JSON.stringify(json)
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
}
