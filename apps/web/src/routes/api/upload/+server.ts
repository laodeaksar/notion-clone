import { PUBLIC_API_GATEWAY_URL } from '$env/static/public';

export async function POST({ request }: { request: Request }) {
  const payload = await request.json();
  const res = await fetch(`${PUBLIC_API_GATEWAY_URL}/upload`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
}
