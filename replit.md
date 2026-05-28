# Notion Clone

A full-stack Notion clone built as a monorepo with a SvelteKit frontend, microservices backend, and real-time collaboration via Liveblocks.

## Architecture

- **Frontend** (`apps/web`): SvelteKit + Tailwind CSS + TipTap editor with Yjs real-time collaboration powered by Liveblocks
- **API Gateway** (`apps/api-gateway`): **Hono v4 + Valibot on Cloudflare Workers** — rate limiting (CF KV), session validation via better-auth, metrics endpoint, proxies to all microservices. Deploy with `pnpm --filter @workspace/api-gateway deploy`.
- **Auth Service** (`services/auth-service`): **Hono + better-auth on Cloudflare Workers** — session-based auth (DB-backed), email+password registration/login, Bearer token validation. Deploy with `pnpm --filter @workspace/auth-service deploy`.
- **Page Service** (`services/page-service`): **Hono + Valibot on Cloudflare Workers** — page CRUD + inline comment CRUD with auth middleware. Deploy with `pnpm --filter @workspace/page-service deploy`.
- **Block Service** (`services/block-service`): **Hono + Valibot on Cloudflare Workers** — content blocks CRUD with auth middleware. Deploy with `pnpm --filter @workspace/block-service deploy`.
- **File Service** (`services/file-service`): **Hono + Valibot on Cloudflare Workers** — Cloudinary upload via REST API (fetch-based, no SDK). Deploy with `pnpm --filter @workspace/file-service deploy`.
- **PartyKit Service** (`services/partykit-service`): **Deprecated** — replaced by Liveblocks. Directory retained for reference but not started in development and not deployed.

## Real-time Collaboration (Liveblocks)

- **Provider**: `@liveblocks/client` + `@liveblocks/yjs` replace the previous PartyKit/y-websocket setup
- **Auth endpoint**: `POST /api/liveblocks-auth` (SvelteKit server route) — validates the session cookie against auth-service, then calls the Liveblocks API to issue a room token
- **Presence**: live avatar stack + join/leave toast notifications via `room.subscribe('others', ...)`
- **Inline comments**: TipTap `CommentMark` extension stores `commentId` in the shared Yjs document; comment metadata (quote, text, author) stored in `page_comments` table

## Package Manager

Uses **pnpm** workspaces with **Turborepo** for task orchestration.

## Ports

- `5000` — SvelteKit frontend (webview)
- `8080` — API Gateway
- `8081` — Block Service
- `8082` — Page Service
- `8083` — Auth Service
- `8084` — File Service

## Environment Variables

- `PUBLIC_API_GATEWAY_URL` — Public URL for the API gateway (used in browser)
- `API_GATEWAY_URL` — Server-side URL for the API gateway
- `LIVEBLOCKS_SECRET_KEY` — Secret key from liveblocks.io dashboard (used by `/api/liveblocks-auth`)
- `JWT_SECRET` — Used to sign internal server-to-server JWTs
- `BETTER_AUTH_SECRET` — Secret used by better-auth for session signing (auto-derived from JWT_SECRET in dev)
- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)

## Auth Flow (better-auth)

1. Browser → POST `/auth/sign-in/email` or `/auth/sign-up/email` (via gateway)
2. better-auth returns `{ token, user }` — token stored in `better-auth.session_token` cookie (httpOnly)
3. Subsequent requests: gateway reads cookie or `Authorization: Bearer <token>`, validates via auth-service `GET /api/auth/get-session`
4. Gateway injects `x-user-id` + `x-user-email` headers for downstream services (page/block/file)
5. Liveblocks auth: SvelteKit `/api/liveblocks-auth` validates the session cookie, then exchanges it for a Liveblocks room token via `LIVEBLOCKS_SECRET_KEY`

## DB Tables

### better-auth managed
- `users` — extended with `email_verified`, `image` columns; `password_hash` now nullable
- `sessions` — active sessions (token, expiry, user reference)
- `accounts` — credential storage (email+password hashed by better-auth)
- `verifications` — email verification / password reset tokens

### Application tables
- `pages` — user pages (title, parentId, userId)
- `blocks` — content blocks per page (type, content JSON, order)
- `page_comments` — inline comments (pageId, userId, userName, quote, text, resolved) — migration 0008
- `files` — uploaded file records (Cloudinary URLs, size, pageId)
- `user_storage_quotas` — per-user storage limits
- `search_index` — full-text search index per page

## Running

```bash
bash start.sh
```

This starts all microservices in parallel (as Node.js processes via `tsx`) and then the SvelteKit dev server.

## User Preferences

- Monorepo structure with pnpm workspaces
- SvelteKit for frontend
- All microservices run as Node.js (`node --import tsx src/server.node.ts`), not wrangler dev — wrangler cannot reach the Replit PostgreSQL host
- Liveblocks for real-time collaboration (replaced PartyKit)
