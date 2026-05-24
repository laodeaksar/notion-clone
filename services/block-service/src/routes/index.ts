import { Elysia } from 'elysia';
import { blockRoutes } from './blocks';

export const routes = new Elysia()
  .get('/', () => ({ status: 'ok', service: 'block-service' }))
  .use(blockRoutes);
