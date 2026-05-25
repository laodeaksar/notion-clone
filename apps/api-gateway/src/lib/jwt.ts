export { verifyJWT } from '@workspace/shared';

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
