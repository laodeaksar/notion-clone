/**
 * Re-exports verifyJWT so consumers can import from '@workspace/shared'.
 *
 * This package is framework-agnostic — Hono-specific middleware lives in each
 * service's own middleware/auth.ts to preserve correct HonoEnv typing.
 */
export { verifyJWT } from '../lib/jwt';
