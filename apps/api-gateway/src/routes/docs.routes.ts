import { Hono } from 'hono';
import type { Bindings, HonoEnv } from '../types/gateway.types';
import { openapiSpec } from '../lib/openapi';
import { gatewayMetrics } from '../middleware/metrics';
import { peekRateLimit } from '../middleware/rate-limit';
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW } from '../config';

export const docsRoutes = new Hono<HonoEnv>();

docsRoutes.get('/health', (c) =>
  c.json({ status: 'ok', service: 'api-gateway' })
);

docsRoutes.get('/openapi.json', (c) => c.json(openapiSpec));

docsRoutes.get('/metrics', (c) => {
  const now           = Date.now();
  const uptimeSeconds = Math.floor((now - gatewayMetrics.startedAt) / 1000);

  const paths = Object.entries(gatewayMetrics.paths)
    .map(([path, s]) => ({
      path,
      requests:     s.count,
      avgLatencyMs: s.count > 0 ? Math.round(s.latencySum / s.count) : 0,
      errors:       s.errors,
      rateLimited:  s.rateLimited
    }))
    .sort((a, b) => b.requests - a.requests);

  return c.json({
    startedAt:        new Date(gatewayMetrics.startedAt).toISOString(),
    uptimeSeconds,
    totalRequests:    gatewayMetrics.totalRequests,
    totalRateLimited: gatewayMetrics.totalRateLimited,
    totalErrors:      gatewayMetrics.totalErrors,
    paths,
    note: 'Counters are in-memory and reset on server restart.'
  });
});

docsRoutes.get('/rate-limit/status', async (c) => {
  const ip =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown';

  const kv = (c.env as Partial<Bindings>)?.RATE_LIMIT_KV;
  const { used, remaining, resetAt } = await peekRateLimit(ip, kv);
  const now = Math.ceil(Date.now() / 1000);

  return c.json({
    ip,
    limit:    RATE_LIMIT_MAX,
    used,
    remaining,
    resetAt,
    resetsIn: Math.max(0, resetAt - now),
    window:   RATE_LIMIT_WINDOW
  });
});

docsRoutes.get('/docs', (c) =>
  c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Notion Clone API</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; }
      .swagger-ui .topbar { background-color: #1e1e2e; }
      .swagger-ui .topbar-wrapper img { content: none; }
      .swagger-ui .topbar-wrapper::before {
        content: "Notion Clone API";
        color: #cdd6f4;
        font-size: 1.1rem;
        font-weight: 600;
        padding-left: 1rem;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin="anonymous"></script>
    <script>
      window.onload = async () => {
        const spec = await fetch('/openapi.json').then(r => r.json());
        spec.servers = [{ url: window.location.origin, description: 'Current server' }];
        window.ui = SwaggerUIBundle({
          spec,
          dom_id: '#swagger-ui',
          deepLinking: true,
          persistAuthorization: true,
          displayRequestDuration: true,
          tryItOutEnabled: true,
          filter: true,
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 2,
        });
      };
    </script>
  </body>
</html>`)
);
