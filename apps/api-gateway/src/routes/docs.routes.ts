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

docsRoutes.get('/ping', async (c) => {
  const cf      = (c.req.raw as any).cf;
  const started = Date.now();

  const services: Record<string, string> = {
    auth:  (c.env as any)?.AUTH_SERVICE_URL  ?? 'http://localhost:8083',
    page:  (c.env as any)?.PAGE_SERVICE_URL  ?? 'http://localhost:8082',
    block: (c.env as any)?.BLOCK_SERVICE_URL ?? 'http://localhost:8081',
    file:  (c.env as any)?.FILE_SERVICE_URL  ?? 'http://localhost:8084'
  };

  const checks = await Promise.all(
    Object.entries(services).map(async ([name, url]) => {
      const t0 = Date.now();
      try {
        const res  = await fetch(`${url}/ping`, { signal: AbortSignal.timeout(3000) });
        const body = res.ok ? await res.json() : null;
        return { name, status: res.ok ? 'ok' : 'error', latencyMs: Date.now() - t0, region: (body as any)?.region ?? null };
      } catch {
        return { name, status: 'unreachable', latencyMs: Date.now() - t0, region: null };
      }
    })
  );

  const allOk = checks.every((s) => s.status === 'ok');

  return c.json(
    {
      status:        allOk ? 'ok' : 'degraded',
      service:       'api-gateway',
      version:       '0.0.1',
      region:        cf?.colo ?? 'local',
      gatewayUptimeMs: Date.now() - started,
      timestamp:     new Date().toISOString(),
      upstreams:     checks
    },
    allOk ? 200 : 207
  );
});

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
      .redoc-link {
        position: fixed;
        bottom: 1.25rem;
        right: 1.25rem;
        z-index: 9999;
        background: #1e1e2e;
        color: #cdd6f4;
        font-family: sans-serif;
        font-size: 0.8rem;
        padding: 0.45rem 0.9rem;
        border-radius: 6px;
        text-decoration: none;
        box-shadow: 0 2px 8px rgba(0,0,0,.35);
      }
      .redoc-link:hover { background: #313244; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <a class="redoc-link" href="/redoc" target="_blank">ReDoc (with code samples) →</a>
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

docsRoutes.get('/redoc', (c) =>
  c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Notion Clone API — ReDoc</title>
    <style>
      body { margin: 0; padding: 0; }
      .swagger-link {
        position: fixed;
        top: 1rem;
        right: 1.25rem;
        z-index: 9999;
        background: #1e1e2e;
        color: #cdd6f4;
        font-family: sans-serif;
        font-size: 0.8rem;
        padding: 0.45rem 0.9rem;
        border-radius: 6px;
        text-decoration: none;
        box-shadow: 0 2px 8px rgba(0,0,0,.35);
      }
      .swagger-link:hover { background: #313244; }
    </style>
  </head>
  <body>
    <a class="swagger-link" href="/docs">← Swagger UI (try it out)</a>
    <div id="redoc-container"></div>
    <script src="https://cdn.jsdelivr.net/npm/redoc/bundles/redoc.standalone.js" crossorigin="anonymous"></script>
    <script>
      Redoc.init(
        '/openapi.json',
        {
          theme: {
            colors: { primary: { main: '#89b4fa' } },
            typography: { fontSize: '15px', fontFamily: 'Inter, system-ui, sans-serif' },
            sidebar: { backgroundColor: '#1e1e2e', textColor: '#cdd6f4' },
            rightPanel: { backgroundColor: '#181825' }
          },
          hideDownloadButton: false,
          hideHostname: false,
          pathInMiddlePanel: false,
          scrollYOffset: 0,
          expandResponses: '200',
          requiredPropsFirst: true,
          sortPropsAlphabetically: false,
          showExtensions: ['x-codeSamples']
        },
        document.getElementById('redoc-container')
      );
    </script>
  </body>
</html>`)
);
