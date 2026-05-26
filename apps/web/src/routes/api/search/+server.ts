import { API_GATEWAY_URL } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent) {
  const token = event.cookies.get('token');
  if (!token) {
    return new Response(JSON.stringify({ query: '', results: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  const q   = event.url.searchParams.get('q') ?? '';
  const res = await fetch(`${API_GATEWAY_URL}/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { 'content-type': 'application/json' }
  });
}
