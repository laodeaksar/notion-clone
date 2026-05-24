import { Hono } from 'hono';
import { blockRoutes } from './blocks';
import type { HonoEnv } from '../types/env';

export const routes = new Hono<HonoEnv>()
  .get('/', (c) => c.json({ status: 'ok', service: 'block-service' }))
  .route('/blocks', blockRoutes);
