import { Hono } from 'hono';
import { authRoutes } from './auth';
import type { HonoEnv } from '../types/env';

export const routes = new Hono<HonoEnv>()
  .get('/', (c) => c.json({ status: 'ok', service: 'auth-service' }))
  .route('/', authRoutes);
