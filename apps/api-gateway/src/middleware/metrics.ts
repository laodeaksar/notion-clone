import type { MiddlewareHandler } from 'hono';
import type { GatewayMetrics, Bindings } from '../types/gateway.types';
import { METRICS_SKIP } from '../config';

export const gatewayMetrics: GatewayMetrics = {
  startedAt: Date.now(),
  totalRequests: 0,
  totalRateLimited: 0,
  totalErrors: 0,
  paths: {}
};

function normalizePath(path: string): string {
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+(?=\/|$)/g, '/:id');
}

export const metricsMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  if (METRICS_SKIP.has(c.req.path)) return next();

  const start = Date.now();
  await next();
  const latency = Date.now() - start;
  const status = c.res.status;
  const normPath = normalizePath(c.req.path);

  gatewayMetrics.totalRequests++;
  const stat = (gatewayMetrics.paths[normPath] ??= {
    count: 0,
    latencySum: 0,
    errors: 0,
    rateLimited: 0
  });
  stat.count++;
  stat.latencySum += latency;
  if (status === 429) { stat.rateLimited++; gatewayMetrics.totalRateLimited++; }
  else if (status >= 500) { stat.errors++; gatewayMetrics.totalErrors++; }
};
