import { Elysia } from 'elysia';
import { authRoutes } from './auth';

export const routes = new Elysia()
  .get('/', () => ({ status: 'ok', service: 'auth-service' }))
  .use(authRoutes);
