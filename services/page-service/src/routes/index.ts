import { Hono } from 'hono';
import { pageRoutes } from './pages';
import type { HonoEnv } from '../types/env';

export const routes = new Hono<HonoEnv>()
  .get('/', (c) => c.json({ status: 'ok', service: 'page-service' }))
  .route('/pages', pageRoutes);
