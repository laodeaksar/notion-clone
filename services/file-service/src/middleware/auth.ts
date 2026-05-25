import type { MiddlewareHandler } from 'hono';
import { verifyJWT } from '@workspace/shared';
import type { HonoEnv } from '../types/env';

export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);

  c.set('userId', payload.sub as string);
  c.set('userEmail', payload.email as string);
  await next();
};
