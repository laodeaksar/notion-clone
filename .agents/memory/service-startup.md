---
name: Service startup mode
description: How all microservices start in local dev — Node.js via server.node.ts, not wrangler dev
---

All CF Worker services now start as plain Node.js HTTP servers using `@hono/node-server` + tsx.
Wrangler dev (miniflare/workerd) CANNOT reach Replit's `helium:5432` PostgreSQL via `cloudflare:sockets`.

**How:**
- Each service has `src/server.node.ts` that does `serve({ fetch: (req) => app.fetch(req, process.env as any), port })`.
- `start.sh` runs: `PORT=<N> node --import tsx src/server.node.ts` for each service.
- Env vars exported in `start.sh` shell scope (not `.dev.vars`) — read via `process.env as any` passed to `app.fetch`.

**Port map:** auth=8083, block=8081, page=8082, file=8084, gateway=8080, hocuspocus=1234, frontend=5000.

**Why:** `cloudflare:sockets` in miniflare/workerd cannot establish TCP to `helium:5432`. Node.js TCP works fine.

**Wrangler still needed** for `wrangler deploy` to production CF Workers — only local startup changed.

**Hocuspocus service**: Must run with `node --import tsx src/index.ts`, NOT bun. Unchanged.

**DB driver**: `packages/db/src/index.ts` uses `postgres-js` (drizzle-orm/postgres-js) with `ssl: 'prefer'` and `prepare: false`.

**Proxy body**: Gateway proxy routes must use `await c.req.arrayBuffer()` for POST/PUT body, NOT `c.req.raw.body` — ReadableStream can't be passed directly to Node.js `fetch()`.

**better-auth trustedOrigins**: auth.ts always includes all localhost ports (5000-8084) in trustedOrigins so internal service-to-service calls aren't rejected by origin check.
