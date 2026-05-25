import * as v from 'valibot';
import { RegisterSchema, LoginSchema } from '../types/auth.types';
import { createUserRepo } from '../repository/user.repo';
import { createLockoutStore, LOCKOUT_THRESHOLD } from '../repository/lockout.repo';
import type { Db } from '@workspace/db';
import type { PublicUser } from '../types/auth.types';

/** SHA-256 password hash using Web Crypto API (CF Workers compatible) */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** HS256 JWT sign using Web Crypto API (CF Workers compatible) */
async function signJWT(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
  const body = btoa(JSON.stringify({ ...payload, exp }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuf = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${header}.${body}`)
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
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
      return { id: user.id, email: user.email, name: user.name };
    },

    async login(input: v.InferInput<typeof LoginSchema>): Promise<string> {
      const email = input.email.toLowerCase().trim();

      // 1. Check if account is currently locked
      const { locked, retryAfter } = await lockout.isLocked(email);
      if (locked) {
        const err = new Error(
          `Account temporarily locked due to too many failed attempts. Try again in ${retryAfter} seconds.`
        );
        (err as any).status     = 429;
        (err as any).retryAfter = retryAfter;
        throw err;
      }

      // 2. Validate credentials
      const user   = await userRepo.findByEmail(email);
      const hashed = await hashPassword(input.password);

      if (!user || user.passwordHash !== hashed) {
        const { attempts, locked: nowLocked } = await lockout.recordFailure(email);
        const remaining = LOCKOUT_THRESHOLD - attempts;
        const message   = nowLocked
          ? `Too many failed attempts. Account locked for 15 minutes.`
          : `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`;
        const err = new Error(message);
        (err as any).status = nowLocked ? 429 : 401;
        throw err;
      }

      // 3. Successful login — clear failure counter
      await lockout.clearFailures(email);

      return signJWT({ sub: user.id, email: user.email }, jwtSecret);
    }
  };
}
