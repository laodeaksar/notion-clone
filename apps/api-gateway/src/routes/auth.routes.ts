import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import type { HonoEnv } from '../types/gateway.types';
import { RegisterBodySchema, LoginBodySchema } from '../types/gateway.types';
import { getEnv } from '../config';
import { proxyJson } from '../services/proxy.service';
import { requireAuth } from '../middleware/auth';

const onInvalid = (result: any, c: any) => {
  if (!result.success) {
    return c.json({ error: 'Invalid input', issues: result.issues }, 400);
  }
};

export const authRoutes = new Hono<HonoEnv>();

authRoutes.post(
  '/auth/register',
  vValidator('json', RegisterBodySchema, onInvalid),
  async (c) => {
    const body    = c.req.valid('json');
    const authUrl = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');
    const { data, status } = await proxyJson(authUrl, '/register', {
      method:  'POST',
      body:    JSON.stringify(body),
      headers: { 'content-type': 'application/json' }
    });
    return c.json(data, status as any);
  }
);

authRoutes.post(
  '/auth/login',
  vValidator('json', LoginBodySchema, onInvalid),
  async (c) => {
    const body    = c.req.valid('json');
    const authUrl = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');
    const { data, status } = await proxyJson<{ token?: string }>(authUrl, '/login', {
      method:  'POST',
      body:    JSON.stringify(body),
      headers: { 'content-type': 'application/json' }
    });

    if (status === 200 && data.token) {
      c.header('set-cookie', `token=${data.token}; HttpOnly; Path=/; SameSite=Lax`);
    }
    return c.json(data, status as any);
  }
);

// requireAuth middleware sets c.var.jwtPayload before this handler runs
authRoutes.get('/me', requireAuth, (c) => {
  return c.json({ user: c.var.jwtPayload });
});
