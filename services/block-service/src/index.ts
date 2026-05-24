import { Elysia } from 'elysia';
import { routes } from './routes/index';
import { PORT } from './config';

const app = new Elysia()
  .use(routes)
  .listen(PORT);

console.log(`[block-service] running on port ${PORT}`);

export type App = typeof app;
