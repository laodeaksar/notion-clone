import type { Handle } from '@sveltejs/kit';
import { JWT_SECRET } from '$env/static/private';

interface JWTPayload {
  sub:   string;
  email: string;
  name?: string | null;
  exp:   number;
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, sig] = parts;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(`${header}.${payload}`)
    );

    if (!valid) return null;

    const decoded: JWTPayload = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );

    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;

    return decoded;
  } catch {
    return null;
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('token');

  if (token) {
    const payload = await verifyJWT(token, JWT_SECRET);
    if (payload) {
      event.locals.user = {
        id:    payload.sub,
        email: payload.email,
        name:  payload.name ?? null
      };
    } else {
      event.locals.user = null;
      event.cookies.delete('token', { path: '/' });
    }
  } else {
    event.locals.user = null;
  }

  return resolve(event);
};
