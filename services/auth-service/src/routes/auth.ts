import { Elysia } from 'elysia';
import { authService } from '../services/auth.service';

export const authRoutes = new Elysia()
  .post('/register', async ({ body, set }) => {
    try {
      const user = await authService.register(body);
      set.status = 201;
      return { user };
    } catch (err: any) {
      set.status = err.status ?? 400;
      return { error: err.message ?? 'Invalid input' };
    }
  })

  .post('/login', async ({ body, set }) => {
    try {
      const token = await authService.login(body);
      return { token };
    } catch (err: any) {
      set.status = err.status ?? 400;
      return { error: err.message ?? 'Invalid input' };
    }
  });
