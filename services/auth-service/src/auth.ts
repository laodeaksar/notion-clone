import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins';
import { createDb, users, sessions, accounts, verifications } from '@workspace/db';

type AuthEnv = {
  DATABASE_URL:        string;
  BETTER_AUTH_SECRET?: string;
  ALLOWED_ORIGINS?:    string;
  GATEWAY_ORIGIN?:     string;
  REPLIT_DEV_DOMAIN?:  string;
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
  const db      = createDb(env.DATABASE_URL);
  const baseURL = env.GATEWAY_ORIGIN ?? 'http://localhost:8080';

  // Always include gateway + all local service ports so internal service-to-service
  // calls (and curl tests) aren't rejected by better-auth's origin check.
  const localOrigins = [
    'http://localhost:5000',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084',
    baseURL
  ];
  const extraOrigins = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  // Auto-include Replit dev domain so the proxied preview works without
  // needing ALLOWED_ORIGINS to be pre-populated at startup.
  const replitDomain = env.REPLIT_DEV_DOMAIN ?? process.env.REPLIT_DEV_DOMAIN;
  const replitOrigins = replitDomain
    ? [`https://${replitDomain}`, `http://${replitDomain}`]
    : [];
  const trustedOrigins = [...new Set([...localOrigins, ...extraOrigins, ...replitOrigins])];

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
