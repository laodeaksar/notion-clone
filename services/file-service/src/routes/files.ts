import { Elysia } from 'elysia';
import { fileService } from '../services/file.service';

export const fileRoutes = new Elysia({ prefix: '/upload' })
  .post('/', async ({ body, set }) => {
    try {
      const result = await fileService.upload(body);
      return result;
    } catch (err: any) {
      set.status = 400;
      return { error: err.message ?? 'Upload failed' };
    }
  });
