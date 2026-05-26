import { Hono } from 'hono';
import type { HonoEnv } from './types/gateway.types';
import { corsMiddleware, securityHeadersMiddleware } from './middleware/cors';
import { metricsMiddleware }     from './middleware/metrics';
import { rateLimitMiddleware }   from './middleware/rate-limit';
import { autoRefreshMiddleware } from './middleware/auto-refresh';
import { registerRoutes }        from './routes/index';

const app = new Hono<HonoEnv>();

// Global middleware — order matters:
//  cors            → restrict cross-origin requests to allowed origins
//  security-headers→ attach security headers to every response
//  metrics         → wrap full lifecycle for accurate latency + status tracking
//  rate-limit      → gate excessive traffic before any work is done
//  auto-refresh    → silently renew near-expired access tokens (no-op if not applicable)
app.use('*', corsMiddleware);
app.use('*', securityHeadersMiddleware);
app.use('*', metricsMiddleware);
app.use('*', rateLimitMiddleware);
app.use('*', autoRefreshMiddleware);

registerRoutes(app);

export default app;
