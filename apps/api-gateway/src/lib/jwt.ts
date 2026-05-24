export async function verifyJWT(
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
    const sig    = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
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

/**
 * Decode the JWT payload without verifying the signature.
 * Only used for expiry checks — never trust the decoded data for auth decisions.
 */
export function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return null;
    const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(padded + '='.repeat((4 - (padded.length % 4)) % 4)));
  } catch {
    return null;
  }
}

/**
 * Returns how many seconds remain until the token expires.
 * Returns null if the token has no `exp` claim.
 * Negative means the token is already expired.
 */
export function secondsUntilExpiry(token: string): number | null {
  const payload = decodeTokenPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp - Date.now() / 1000;
}

export async function extractToken(
  c: { req: { header: (k: string) => string | undefined } }
): Promise<string | null> {
  const auth = c.req.header('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const cookieHeader = c.req.header('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

export function extractRefreshToken(
  c: { req: { header: (k: string) => string | undefined } }
): string | null {
  const cookieHeader = c.req.header('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)refresh_token=([^;]+)/);
  return match ? match[1] : null;
}
