import { getEnv } from '$lib/server/env';
import { signServerJWT } from '$lib/server/jwt';
import type { RequestEvent } from '@sveltejs/kit';

function getToken(event: RequestEvent): Promise<string> {
  const userToken = event.cookies.get('token');
  if (userToken) return Promise.resolve(userToken);
  return signServerJWT(getEnv(event.platform, 'JWT_SECRET'));
}

export async function PUT(event: RequestEvent) {
  const token           = await getToken(event);
  const API_GATEWAY_URL = getEnv(event.platform, 'API_GATEWAY_URL');
  const id    = event.params.id;
  const json  = await event.request.json().catch(() => null);
  if (!json) return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 });

  const res  = await fetch(`${API_GATEWAY_URL}/pages/${id}`, {
    method:  'PUT',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify(json)
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
}

export async function DELETE(event: RequestEvent) {
  const token           = await getToken(event);
  const API_GATEWAY_URL = getEnv(event.platform, 'API_GATEWAY_URL');
  const id    = event.params.id;

  const res  = await fetch(`${API_GATEWAY_URL}/pages/${id}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
}
