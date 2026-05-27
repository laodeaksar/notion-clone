---
name: Hocuspocus auth
description: HocuspocusProvider requires a session token; how it flows from server to client
---

AUTH_REQUIRED=true by default in hocuspocus-service. The `HocuspocusProvider` in `Editor.svelte` must receive the session token via `token:` prop or all WebSocket connections will fail with "Unauthorized".

**Flow:**
1. `+layout.server.ts` reads `locals.sessionToken ?? cookies.get('better-auth.session_token')` and returns it as `sessionToken` in layout data
2. Page data inherits this (SvelteKit merges layout + page data)
3. `Editor.svelte` accesses `data.sessionToken` and passes it to `HocuspocusProvider({ token: data.sessionToken ?? '' })`

**Why:** The session token is the better-auth cookie value. Hocuspocus validates it via `GET /api/auth/get-session` on the auth-service.
