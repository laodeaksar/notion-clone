import { Elysia } from 'elysia';
import { pageRoutes } from './pages';

export const routes = new Elysia()
  .get('/', () => ({ status: 'ok', service: 'page-service' }))
  .use(pageRoutes);
