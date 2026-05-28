import { getEnv } from '$lib/server/env';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent) {
  const API_GATEWAY_URL = getEnv(event.platform, 'API_GATEWAY_URL');
  try {
    const res  = await fetch(`${API_GATEWAY_URL}/metrics`, { signal: AbortSignal.timeout(5000) });
    const body = await res.text();
    return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Gateway unreachable' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }
}
