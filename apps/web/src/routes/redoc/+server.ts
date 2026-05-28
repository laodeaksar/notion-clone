import { getEnv } from '$lib/server/env';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ platform }: RequestEvent) {
  const gatewayUrl = getEnv(platform, 'API_GATEWAY_URL') || 'http://localhost:8080';
  const res = await fetch(`${gatewayUrl}/redoc`);
  const html = await res.text();
  return new Response(html, {
    status: res.status,
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}
