import { API_GATEWAY_URL } from '$env/dynamic/private';
import { signServerJWT } from '$lib/server/jwt';
import type { RequestEvent } from '@sveltejs/kit';

function getToken(event: RequestEvent): Promise<string> {
  const userToken = event.cookies.get('token');
  if (userToken) return Promise.resolve(userToken);
  return signServerJWT();
}

export async function POST(event: RequestEvent) {
  const { request } = event;
  const token       = await getToken(event);
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const res  = await fetch(`${API_GATEWAY_URL}/upload`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    form
    });
    const body = await res.text();
    return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
  }

  const json = await request.json().catch(() => null);
  if (!json) {
    return new Response(JSON.stringify({ error: 'Invalid body' }), {
      status: 400, headers: { 'content-type': 'application/json' }
    });
  }

  const res = await fetch(`${API_GATEWAY_URL}/upload`, {
    method:  'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify(json)
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
}
