import { Hono } from 'hono';
import type { HonoEnv } from './types/gateway.types';
import { corsMiddleware, securityHeadersMiddleware } from './middleware/cors';
import { metricsMiddleware }   from './middleware/metrics';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { registerRoutes }      from './routes/index';

const app = new Hono<HonoEnv>();

// Global middleware — order matters:
//  cors             → restrict cross-origin requests to allowed origins
//  security-headers → attach security headers to every response
//  metrics          → wrap full lifecycle for accurate latency + status tracking
//  rate-limit       → gate excessive traffic before any work is done
app.use('*', corsMiddleware);
app.use('*', securityHeadersMiddleware);
app.use('*', metricsMiddleware);
app.use('*', rateLimitMiddleware);

registerRoutes(app);

export default app;
