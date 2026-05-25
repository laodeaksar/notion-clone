import { API_GATEWAY_URL, JWT_SECRET } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

async function signServerJWT(secret: string): Promise<string> {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const payload = btoa(JSON.stringify({
    sub:   'server',
    email: 'server@internal',
    role:  'server',
    iat:   Math.floor(Date.now() / 1000),
    exp:   Math.floor(Date.now() / 1000) + 300
  })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payload}`));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${header}.${payload}.${sigB64}`;
}

function getToken(event: RequestEvent): Promise<string> {
  const userToken = event.cookies.get('token');
  if (userToken) return Promise.resolve(userToken);
  return signServerJWT(JWT_SECRET);
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
