import * as v from 'valibot';

// ─── Cloudflare / Bun Bindings ────────────────────────────────────────────────

export type Bindings = {
  JWT_SECRET:               string;
  DATABASE_URL:             string;
  PAGE_SERVICE_URL:         string;
  AUTH_SERVICE_URL:         string;
  BLOCK_SERVICE_URL:        string;
  FILE_SERVICE_URL:         string;
  UPSTASH_REDIS_REST_URL?:   string;
  UPSTASH_REDIS_REST_TOKEN?: string;
};

// ─── Hono Context Variables (set by middleware, read by handlers) ─────────────

export type GatewayVariables = {
  jwtPayload: Record<string, unknown>;
};

// ─── Combined Hono environment type ──────────────────────────────────────────

export type HonoEnv = {
  Bindings: Bindings;
  Variables: GatewayVariables;
};

// ─── Rate Limit ───────────────────────────────────────────────────────────────

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

// ─── Metrics ──────────────────────────────────────────────────────────────────

export type PathStat = {
  count: number;
  latencySum: number;
  errors: number;
  rateLimited: number;
};

export type GatewayMetrics = {
  startedAt: number;
  totalRequests: number;
  totalRateLimited: number;
  totalErrors: number;
  paths: Record<string, PathStat>;
};

// ─── Valibot Request Schemas ──────────────────────────────────────────────────

export const RegisterBodySchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
  name: v.optional(v.string())
});

export const LoginBodySchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8))
});

export const PageBodySchema = v.object({
  title: v.pipe(v.string(), v.minLength(1)),
  parentId: v.optional(v.nullable(v.string()))
});

export const UploadBodySchema = v.object({
  data: v.pipe(v.string(), v.minLength(1)),
  filename: v.optional(v.string()),
  folder: v.optional(v.string())
});

export type RegisterBody = v.InferOutput<typeof RegisterBodySchema>;
export type LoginBody    = v.InferOutput<typeof LoginBodySchema>;
export type PageBody     = v.InferOutput<typeof PageBodySchema>;
export type UploadBody   = v.InferOutput<typeof UploadBodySchema>;
