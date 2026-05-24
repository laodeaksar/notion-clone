import type { Bindings } from './types/gateway.types';

export const RATE_LIMIT_MAX = 100;
export const RATE_LIMIT_WINDOW = 60;

export const METRICS_SKIP = new Set([
  '/metrics',
  '/docs',
  '/openapi.json',
  '/health',
  '/rate-limit/status'
]);

export const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

export function getEnv(
  c: { env?: Partial<Bindings> },
  key: Exclude<keyof Bindings, 'RATE_LIMIT_KV'>,
  fallback: string
): string {
  const fromBinding = c.env?.[key];
  if (fromBinding) return fromBinding as string;
  if (typeof process !== 'undefined' && process.env[key]) return process.env[key] as string;
  return fallback;
}
