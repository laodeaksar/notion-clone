import type { Context } from 'elysia';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

async function verifyJWT(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const sig = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = sig + '='.repeat((4 - (sig.length % 4)) % 4);
    const signature = Uint8Array.from(atob(padded), (ch) => ch.charCodeAt(0));

    const valid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!valid) return null;

    const padPayload = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(
      atob(padPayload + '='.repeat((4 - (padPayload.length % 4)) % 4))
    );

    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function authMiddleware({ request, set }: Context) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    set.status = 401;
    return { error: 'Unauthorized' };
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    set.status = 401;
    return { error: 'Unauthorized' };
  }
}
