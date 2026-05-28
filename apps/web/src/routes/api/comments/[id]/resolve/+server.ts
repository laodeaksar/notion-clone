import { getEnv } from '$lib/server/env';
import type { RequestEvent } from '@sveltejs/kit';

export async function PATCH(event: RequestEvent) {
  const sessionToken = event.cookies.get('better-auth.session_token');
  if (!sessionToken) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const API_GATEWAY_URL = getEnv(event.platform, 'API_GATEWAY_URL');
  const id  = event.params.id;
  const res = await fetch(`${API_GATEWAY_URL}/comments/${id}/resolve`, {
    method:  'PATCH',
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
}
