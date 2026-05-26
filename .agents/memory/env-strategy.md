---
name: Env var strategy
description: How environment variables are read in apps/web — dual CF Pages + Replit compatibility
---

All private env vars (API_GATEWAY_URL, JWT_SECRET, etc.) are read via `getEnv()` from `$lib/server/env.ts`:

```ts
export function getEnv(platform: App.Platform | undefined, key: string): string {
  return (platform?.env as Record<string, string> | undefined)?.[key] ?? process.env[key] ?? '';
}
```

**Why:** `$env/static/private` only works at build time (breaks CF Pages secrets). `$env/dynamic/private` adds unnecessary coupling to SvelteKit internals. `platform.env` is the CF Pages runtime approach; `process.env` is the Node/Replit fallback. The helper handles both transparently.

**How to apply:** Every server-side file (hooks.server.ts, +server.ts, +page.server.ts) calls `getEnv(event.platform, 'KEY')` or `getEnv(platform, 'KEY')`. The `signServerJWT()` function in `$lib/server/jwt.ts` accepts the secret as a parameter so callers control where it comes from.

Public vars (like PUBLIC_HOCUSPOCUS_URL) are returned from the layout server load function as `hocuspocusUrl` in page data, not imported from `$env` modules. Editor.svelte reads it from `data.hocuspocusUrl ?? 'ws://localhost:1234'`.

For local dev: values come from `[userenv.shared]` in `.replit` (non-secret) and Replit secrets (DATABASE_URL, etc.).
For CF Pages: values come from CF Pages environment variables / secrets bound to the worker via `.dev.vars` locally.
