import * as v from 'valibot';
import { RegisterSchema, LoginSchema } from '../types/auth.types';
import { createUserRepo } from '../repository/user.repo';
import { createLockoutStore, LOCKOUT_THRESHOLD } from '../repository/lockout.repo';
import { userStorageQuotas } from '@workspace/db';
import type { Db } from '@workspace/db';
import type { PublicUser } from '../types/auth.types';

const DEFAULT_QUOTA_BYTES = 100 * 1024 * 1024;

const PBKDF2_ITERATIONS = 310_000;
const PBKDF2_HASH       = 'SHA-256';
const PBKDF2_BITS       = 256;

/**
 * Hashes a password using PBKDF2-SHA256 with a random 16-byte salt.
 * Output: "<saltHex>:<hashHex>" — unique salt per user defeats rainbow tables.
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt    = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    keyMaterial,
    PBKDF2_BITS
  );

  const toHex = (arr: Uint8Array) =>
    Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${toHex(salt)}:${toHex(new Uint8Array(bits))}`;
}

/**
 * Verifies a password against a stored hash.
 *
 * Handles two formats for backward compatibility during migration:
 *   PBKDF2 (new): "<saltHex>:<hashHex>"
 *   SHA-256 (legacy): "<64-char hex>" — no colon
 *
 * Returns { valid, needsRehash } so the caller can transparently
 * upgrade legacy SHA-256 passwords to PBKDF2 on the next successful login.
 */
async function verifyPassword(
  password: string,
  stored: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  const encoder = new TextEncoder();

  if (!stored.includes(':')) {
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode(password));
    const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return { valid: timingSafeEqual(hex, stored), needsRehash: true };
  }

  const colonIdx = stored.indexOf(':');
  const saltHex  = stored.slice(0, colonIdx);
  const hashHex  = stored.slice(colonIdx + 1);

  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)));

  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    keyMaterial,
    PBKDF2_BITS
  );

  const derived = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return { valid: timingSafeEqual(derived, hashHex), needsRehash: false };
}

/**
 * Constant-time string comparison — prevents timing attacks that could
 * reveal partial hash matches through response-time differences.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function signJWT(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const exp  = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const body = btoa(JSON.stringify({ ...payload, exp }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${body}`));
  const sig    = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${header}.${body}.${sig}`;
}

export function createAuthService(
  db: Db,
  jwtSecret: string,
  upstashUrl?: string,
  upstashToken?: string
) {
  const userRepo = createUserRepo(db);
  const lockout  = createLockoutStore(upstashUrl, upstashToken);

  return {
    async register(input: v.InferInput<typeof RegisterSchema>): Promise<PublicUser> {
      const existing = await userRepo.findByEmail(input.email);
      if (existing) {
        const err = new Error('Email already exists');
        (err as any).status = 409;
        throw err;
      }

      const user = await userRepo.create({
        ...input,
        passwordHash: await hashPassword(input.password)
      });

      await db
        .insert(userStorageQuotas)
        .values({
          userId:     user.id,
          usedBytes:  0,
          limitBytes: DEFAULT_QUOTA_BYTES,
          updatedAt:  new Date()
        })
        .onConflictDoNothing()
        .catch((err) => console.error('[auth-service] quota init failed:', err));

      return { id: user.id, email: user.email, name: user.name };
    },

    async login(input: v.InferInput<typeof LoginSchema>): Promise<string> {
      const email = input.email.toLowerCase().trim();

      const { locked, retryAfter } = await lockout.isLocked(email);
      if (locked) {
        const err = new Error(
          `Account temporarily locked. Try again in ${retryAfter} seconds.`
        );
        (err as any).status     = 429;
        (err as any).retryAfter = retryAfter;
        throw err;
      }

      const user = await userRepo.findByEmail(email);

      // Always run the verification (even if user is null) to prevent
      // user-enumeration via timing differences.
      const storedHash = user?.passwordHash ?? 'dummy:dummy';
      const { valid, needsRehash } = await verifyPassword(input.password, storedHash);

      if (!user || !valid) {
        const { attempts, locked: nowLocked } = await lockout.recordFailure(email);
        const remaining = LOCKOUT_THRESHOLD - attempts;
        const message   = nowLocked
          ? `Too many failed attempts. Account locked for 15 minutes.`
          : `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`;
        const err = new Error(message);
        (err as any).status = nowLocked ? 429 : 401;
        throw err;
      }

      await lockout.clearFailures(email);

      if (needsRehash) {
        const upgraded = await hashPassword(input.password);
        await userRepo.updatePasswordHash(user.id, upgraded).catch(
          (e) => console.error('[auth-service] password rehash failed:', e)
        );
      }

      return signJWT({ sub: user.id, email: user.email }, jwtSecret);
    }
  };
}
