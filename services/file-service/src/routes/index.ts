import { Hono } from 'hono';
import { fileRoutes } from './files';
import type { HonoEnv } from '../types/env';

export const routes = new Hono<HonoEnv>()
  .get('/', (c) => c.json({ status: 'ok', service: 'file-service', provider: 'r2' }))
  .route('/upload', fileRoutes);
