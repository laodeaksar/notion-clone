---
name: Service startup
description: How all services are started locally in Replit via start.sh
---

All backend services are started in `start.sh`. Key rules:

**CF Worker services** (auth, block, page, file-service, api-gateway): Use `pnpm exec wrangler dev --port PORT --inspector-port UNIQUE_PORT --show-interactive-dev-session=false`. Each must get a unique `--inspector-port` to avoid the port 9229 conflict when running multiple wrangler instances in parallel. Assigned ports: auth=9230, block=9231, page=9232, gateway=9233, file=9234.

**file-service**: Runs on port 8084. Its `.dev.vars` is written explicitly with Cloudinary env vars (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) in addition to common vars. It was previously missing from start.sh entirely.

**Why unique inspector ports:** workerd (CF's runtime) binds the inspector port at startup. Without unique ports, all instances after the first crash with "Address already in use (127.0.0.1:9229)".

**Hocuspocus service**: Must run with `node --import tsx src/index.ts`, NOT `bun`. The `crossws` library (used by @hocuspocus/server v4) detects Bun in globalThis and throws "Using Node.js adapter in an incompatible environment."

**Node.js version**: Wrangler v4 requires Node.js v22+. Project uses nodejs-22 module. The `.replit` modules field was updated to `nodejs-22`.

**Env vars for wrangler services**: Written to `.dev.vars` files dynamically at startup via `write_dev_vars()` in start.sh. This is how wrangler dev picks up secrets locally.

**Adapter**: svelte.config.js uses `adapterCloudflare` when `CF_PAGES` env var is set, otherwise `adapterNode` (for Replit). Both adapters are installed.
