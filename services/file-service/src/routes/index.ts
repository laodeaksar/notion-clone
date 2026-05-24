import { Elysia } from 'elysia';
import { fileRoutes } from './files';
import { isCloudinaryConfigured } from '../config';

export const routes = new Elysia()
  .get('/', () => ({
    status: 'ok',
    service: 'file-service',
    provider: isCloudinaryConfigured ? 'cloudinary' : 'local'
  }))
  .use(fileRoutes);
