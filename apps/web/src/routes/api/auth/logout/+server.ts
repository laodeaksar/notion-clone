import type { RequestEvent } from '@sveltejs/kit';
import { API_GATEWAY_URL } from '$env/static/private';

export async function POST({ cookies, fetch }: RequestEvent) {
  const token = cookies.get('token');

  if (token) {
    await fetch(`${API_GATEWAY_URL}/auth/logout`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});
  }

  cookies.delete('token', { path: '/' });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' }
  });
}
