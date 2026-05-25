import * as v from 'valibot';
import { RegisterSchema, LoginSchema } from '../types/auth.types';
import { createUserRepo } from '../repository/user.repo';
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

export function createAuthService(db: Db, jwtSecret: string) {
  const userRepo = createUserRepo(db);

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
      const user = await userRepo.findByEmail(input.email);
      const hashed = await hashPassword(input.password);
      if (!user || user.passwordHash !== hashed) {
        const err = new Error('Invalid credentials');
        (err as any).status = 401;
        throw err;
      }
      return signJWT({ sub: user.id, email: user.email }, jwtSecret);
    }
  };
}
