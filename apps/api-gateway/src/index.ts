import { Hono } from 'hono';
import type { Bindings } from './types/gateway.types';
import { corsMiddleware } from './middleware/cors';
import { metricsMiddleware } from './middleware/metrics';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { registerRoutes } from './routes/index';

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', corsMiddleware);
app.use('*', metricsMiddleware);
app.use('*', rateLimitMiddleware);

registerRoutes(app);

export default app;

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  app.fire();
}
