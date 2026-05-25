import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis/cloudflare';
import { createMiddleware } from 'hono/factory';
import type { Bindings, HonoEnv, RateLimitResult } from '../types/gateway.types';
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW, METRICS_SKIP } from '../config';

// ─── Adapter interface ────────────────────────────────────────────────────────

type RateLimiterAdapter = {
  limit: (ip: string) => Promise<RateLimitResult>;
  peek:  (ip: string) => Promise<{ used: number; remaining: number; resetAt: number }>;
};

// ─── In-memory fallback (local dev without Upstash) ──────────────────────────

const localMap = new Map<string, { count: number; until: number }>();

function createLocalAdapter(): RateLimiterAdapter {
  return {
    async limit(ip) {
      const now   = Date.now();
      let entry   = localMap.get(ip) ?? { count: 0, until: now + RATE_LIMIT_WINDOW * 1000 };
      if (now > entry.until) entry = { count: 0, until: now + RATE_LIMIT_WINDOW * 1000 };
      entry.count++;
      localMap.set(ip, entry);
      return {
        allowed:   entry.count <= RATE_LIMIT_MAX,
        remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
        resetAt:   Math.ceil(entry.until / 1000)
      };
    },
    async peek(ip) {
      const now   = Date.now();
      const entry = localMap.get(ip);
      if (!entry || now > entry.until) {
        return { used: 0, remaining: RATE_LIMIT_MAX, resetAt: Math.ceil((now + RATE_LIMIT_WINDOW * 1000) / 1000) };
      }
      return {
        used:      entry.count,
        remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
        resetAt:   Math.ceil(entry.until / 1000)
      };
    }
  };
}

// ─── Upstash adapter ─────────────────────────────────────────────────────────

function createUpstashAdapter(url: string, token: string): RateLimiterAdapter {
  const redis   = new Redis({ url, token });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, `${RATE_LIMIT_WINDOW} s`),
    prefix:  'rl',
    ephemeralCache: new Map()
  });

  return {
    async limit(ip) {
      const { success, remaining, reset } = await limiter.limit(ip);
      return {
        allowed:   success,
        remaining: Math.max(0, remaining),
        resetAt:   Math.ceil(reset / 1000)
      };
    },
    async peek(ip) {
      const now         = Date.now();
      const windowStart = now - RATE_LIMIT_WINDOW * 1000;
      // Read current sliding-window count from the sorted set without consuming a token
      const used = await redis.zcount(`rl:${ip}`, windowStart, '+inf').catch(() => 0);
      return {
        used,
        remaining: Math.max(0, RATE_LIMIT_MAX - used),
        resetAt:   Math.ceil((now + RATE_LIMIT_WINDOW * 1000) / 1000)
      };
    }
  };
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createRateLimiter(env: Partial<Bindings>): RateLimiterAdapter {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return createUpstashAdapter(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
  }
  return createLocalAdapter();
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export const rateLimitMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  if (METRICS_SKIP.has(c.req.path)) return next();

  const ip =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown';

  const adapter = createRateLimiter(c.env as Partial<Bindings>);
  const { allowed, remaining, resetAt } = await adapter.limit(ip);

  c.header('X-RateLimit-Limit',     String(RATE_LIMIT_MAX));
  c.header('X-RateLimit-Remaining', String(remaining));
  c.header('X-RateLimit-Reset',     String(resetAt));

  if (!allowed) {
    return c.json({ error: 'Too many requests', retryAfter: resetAt }, 429);
  }
  return next();
});
