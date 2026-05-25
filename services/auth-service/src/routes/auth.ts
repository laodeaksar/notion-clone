import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import { RegisterSchema, LoginSchema } from '../types/auth.types';
import { createAuthService } from '../services/auth.service';
import { createDb } from '@workspace/db';
import type { HonoEnv } from '../types/env';

export const authRoutes = new Hono<HonoEnv>()

  .post('/register', vValidator('json', RegisterSchema), async (c) => {
    const db  = createDb(c.env.DATABASE_URL);
    const svc = createAuthService(db, c.env.JWT_SECRET);
    try {
      const user = await svc.register(c.req.valid('json'));
      return c.json({ user }, 201);
    } catch (err: any) {
      return c.json({ error: err.message ?? 'Invalid input' }, err.status ?? 400);
    }
  })

  .post('/login', vValidator('json', LoginSchema), async (c) => {
    const db  = createDb(c.env.DATABASE_URL);
    const svc = createAuthService(db, c.env.JWT_SECRET);
    try {
      const token = await svc.login(c.req.valid('json'));
      return c.json({ token });
    } catch (err: any) {
      return c.json({ error: err.message ?? 'Invalid input' }, err.status ?? 400);
    }
  });
