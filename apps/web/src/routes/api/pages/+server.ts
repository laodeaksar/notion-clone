import { API_GATEWAY_URL } from '$env/static/private';
import { signServerJWT } from '$lib/server/jwt';
import type { RequestEvent } from '@sveltejs/kit';

function getToken(event: RequestEvent): Promise<string> {
  const userToken = event.cookies.get('token');
  if (userToken) return Promise.resolve(userToken);
  return signServerJWT();
}

export async function GET(event: RequestEvent) {
  const token = await getToken(event);
  const res   = await fetch(`${API_GATEWAY_URL}/pages`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
}

export async function POST(event: RequestEvent) {
  const token = await getToken(event);
  const json  = await event.request.json().catch(() => null);
  if (!json) return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 });

  const res  = await fetch(`${API_GATEWAY_URL}/pages`, {
    method:  'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify(json)
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
}
