import { getEnv } from '$lib/server/env';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ platform }: RequestEvent) {
  const gatewayUrl = getEnv(platform, 'API_GATEWAY_URL') || 'http://localhost:8080';
  const res = await fetch(`${gatewayUrl}/openapi.json`);
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'content-type': 'application/json' }
  });
}
