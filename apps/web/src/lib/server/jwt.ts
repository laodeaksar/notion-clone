import { JWT_SECRET } from '$env/dynamic/private';

/**
 * Signs a short-lived JWT for internal server-to-server calls.
 * Used when there is no user token available (e.g. background requests).
 */
export async function signServerJWT(): Promise<string> {
  const secret = JWT_SECRET;
  const encoder = new TextEncoder();

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const payload = btoa(JSON.stringify({
    sub:   'server',
    email: 'server@internal',
    role:  'server',
    iat:   Math.floor(Date.now() / 1000),
    exp:   Math.floor(Date.now() / 1000) + 300
  })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payload}`));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return `${header}.${payload}.${sigB64}`;
}
