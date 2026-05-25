/**
 * Canonical JWT implementation using Web Crypto API.
 * Compatible with: Node.js 18+, Cloudflare Workers, Bun.
 *
 * This is the single source of truth for JWT verification across all services.
 * Import from '@workspace/shared' — do NOT copy-paste this into service files.
 */

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

    const data      = encoder.encode(`${headerB64}.${payloadB64}`);
    const sig       = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const padded    = sig + '='.repeat((4 - (sig.length % 4)) % 4);
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
