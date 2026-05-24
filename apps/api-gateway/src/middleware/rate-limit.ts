import type { MiddlewareHandler } from 'hono';
import type { Bindings, RateLimitEntry, RateLimitResult } from '../types/gateway.types';
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW, METRICS_SKIP } from '../config';

const localRateMap = new Map<string, RateLimitEntry>();

export async function checkRateLimit(
  ip: string,
  kv?: KVNamespace
): Promise<RateLimitResult> {
  const now = Date.now();
  let entry: RateLimitEntry;

  if (kv) {
    const key = `rl:${ip}`;
    const raw = await kv.get(key);
    entry = raw
      ? JSON.parse(raw)
      : { count: 0, until: now + RATE_LIMIT_WINDOW * 1000 };

    if (now > entry.until) {
      entry.count = 0;
      entry.until = now + RATE_LIMIT_WINDOW * 1000;
    }
    entry.count++;

    const ttlSeconds = Math.max(1, Math.ceil((entry.until - now) / 1000));
    await kv.put(key, JSON.stringify(entry), { expirationTtl: ttlSeconds });
  } else {
    entry = localRateMap.get(ip) ?? {
      count: 0,
      until: now + RATE_LIMIT_WINDOW * 1000
    };
    if (now > entry.until) {
      entry.count = 0;
      entry.until = now + RATE_LIMIT_WINDOW * 1000;
    }
    entry.count++;
    localRateMap.set(ip, entry);
  }

  return {
    allowed: entry.count <= RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetAt: Math.ceil(entry.until / 1000)
  };
}

export async function peekRateLimit(
  ip: string,
  kv?: KVNamespace
): Promise<{ used: number; remaining: number; resetAt: number }> {
  const now = Date.now();
  let entry: RateLimitEntry | null = null;

  if (kv) {
    const raw = await kv.get(`rl:${ip}`);
    entry = raw ? JSON.parse(raw) : null;
  } else {
    entry = localRateMap.get(ip) ?? null;
  }

  if (!entry || now > entry.until) {
    return {
      used: 0,
      remaining: RATE_LIMIT_MAX,
      resetAt: Math.ceil((now + RATE_LIMIT_WINDOW * 1000) / 1000)
    };
  }

  return {
    used: entry.count,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetAt: Math.ceil(entry.until / 1000)
  };
}

export const rateLimitMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  if (METRICS_SKIP.has(c.req.path)) return next();

  const ip =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown';

  const kv = (c.env as Partial<Bindings>)?.RATE_LIMIT_KV;
  const { allowed, remaining, resetAt } = await checkRateLimit(ip, kv);

  c.header('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
  c.header('X-RateLimit-Remaining', String(remaining));
  c.header('X-RateLimit-Reset', String(resetAt));

  if (!allowed) {
    return c.json({ error: 'Too many requests', retryAfter: resetAt }, 429);
  }
  return next();
};
