import { getEnv } from '$lib/server/env';
import type { RequestEvent } from '@sveltejs/kit';

const unauthorized = () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

export async function POST(event: RequestEvent) {
  const sessionToken = event.cookies.get('better-auth.session_token');
  if (!sessionToken) return unauthorized();

  const { request }     = event;
  const API_GATEWAY_URL = getEnv(event.platform, 'API_GATEWAY_URL');
  const contentType     = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const res  = await fetch(`${API_GATEWAY_URL}/upload`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
      body:    form
    });
    const body = await res.text();
    return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
  }

  const json = await request.json().catch(() => null);
  if (!json) return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers: { 'content-type': 'application/json' } });

  const res  = await fetch(`${API_GATEWAY_URL}/upload`, {
    method:  'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${sessionToken}` },
    body:    JSON.stringify(json)
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
}

export async function GET(event: RequestEvent) {
  const sessionToken = event.cookies.get('better-auth.session_token');
  if (!sessionToken) return unauthorized();

  const { url }         = event;
  const API_GATEWAY_URL = getEnv(event.platform, 'API_GATEWAY_URL');
  const folder  = url.searchParams.get('folder') ?? undefined;
  const cursor  = url.searchParams.get('cursor') ?? undefined;
  const limit   = url.searchParams.get('limit')  ?? '50';

  const params = new URLSearchParams({ limit });
  if (folder) params.set('folder', folder);
  if (cursor) params.set('cursor', cursor);

  const res  = await fetch(`${API_GATEWAY_URL}/upload?${params}`, {
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
}

export async function DELETE(event: RequestEvent) {
  const sessionToken = event.cookies.get('better-auth.session_token');
  if (!sessionToken) return unauthorized();

  const { url }         = event;
  const API_GATEWAY_URL = getEnv(event.platform, 'API_GATEWAY_URL');
  const publicId = url.searchParams.get('publicId');
  if (!publicId) return new Response(JSON.stringify({ error: 'Missing publicId' }), { status: 400, headers: { 'content-type': 'application/json' } });

  const res  = await fetch(`${API_GATEWAY_URL}/upload/${encodeURIComponent(publicId)}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
}
