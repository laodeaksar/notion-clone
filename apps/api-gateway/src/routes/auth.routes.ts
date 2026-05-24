import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import type { Bindings } from '../types/gateway.types';
import { RegisterBodySchema, LoginBodySchema } from '../types/gateway.types';
import { getEnv } from '../config';
import { verifyJWT, extractToken } from '../lib/jwt';
import { proxyJson } from '../services/proxy.service';

const validationError = (result: any, c: any) => {
  if (!result.success) {
    return c.json({ error: 'Invalid input', issues: result.issues }, 400);
  }
};

export const authRoutes = new Hono<{ Bindings: Bindings }>();

authRoutes.post(
  '/auth/register',
  vValidator('json', RegisterBodySchema, validationError),
  async (c) => {
    const body = c.req.valid('json');
    const authUrl = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');
    const { data, status } = await proxyJson(authUrl, '/register', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' }
    });
    return c.json(data, status as any);
  }
);

authRoutes.post(
  '/auth/login',
  vValidator('json', LoginBodySchema, validationError),
  async (c) => {
    const body = c.req.valid('json');
    const authUrl = getEnv(c, 'AUTH_SERVICE_URL', 'http://localhost:8083');
    const { data, status } = await proxyJson<{ token?: string }>(authUrl, '/login', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' }
    });

    if (status === 200 && data.token) {
      c.header('set-cookie', `token=${data.token}; HttpOnly; Path=/; SameSite=Lax`);
    }
    return c.json(data, status as any);
  }
);

authRoutes.get('/me', async (c) => {
  const secret = getEnv(c, 'JWT_SECRET', 'dev-secret');
  const token = await extractToken(c as any);
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  const payload = await verifyJWT(token, secret);
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({ user: payload });
});
