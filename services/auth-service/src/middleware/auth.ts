import type { MiddlewareHandler } from 'hono';
import type { HonoEnv } from '../types/env';

async function verifyJWT(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
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

export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('userId', payload.sub as string);
  c.set('userEmail', payload.email as string);
  await next();
};
