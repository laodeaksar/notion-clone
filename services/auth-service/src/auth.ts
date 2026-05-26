import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins';
import { createDb, users, sessions, accounts, verifications } from '@workspace/db';

type AuthEnv = {
  DATABASE_URL:        string;
  BETTER_AUTH_SECRET?: string;
  ALLOWED_ORIGINS?:    string;
  GATEWAY_ORIGIN?:     string;
};

/**
 * Creates a better-auth instance bound to the provided environment.
 * Called once per request in the Cloudflare Workers environment.
 *
 * Better-auth handles:
 *  - Email + password registration / sign-in (with bcrypt hashing)
 *  - Session creation, validation, and deletion (DB-backed)
 *  - Bearer token validation (via the `bearer` plugin)
 */
export function createAuth(env: AuthEnv) {
  const db             = createDb(env.DATABASE_URL);
  const trustedOrigins = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const baseURL = env.GATEWAY_ORIGIN ?? 'http://localhost:8080';

  return betterAuth({
    secret:   env.BETTER_AUTH_SECRET ?? 'dev-secret-notion-clone-change-in-prod',
    baseURL:  `${baseURL}/auth`,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user:         users,
        session:      sessions,
        account:      accounts,
        verification: verifications
      }
    }),
    trustedOrigins,
    plugins: [bearer()],
    emailAndPassword: {
      enabled:    true,
      autoSignIn: true
    }
  });
}

export type Auth = ReturnType<typeof createAuth>;
