# Notion Clone

A full-stack Notion clone built as a monorepo with a SvelteKit frontend, microservices backend, and real-time collaboration support.

## Architecture

- **Frontend** (`apps/web`): SvelteKit + Tailwind CSS + TipTap editor with Yjs real-time collaboration
- **API Gateway** (`apps/api-gateway`): **Hono v4 + Valibot on Cloudflare Workers** — rate limiting (CF KV), JWT auto-refresh, metrics endpoint, proxies to all microservices. Deploy with `pnpm --filter @workspace/api-gateway deploy`.
- **Auth Service** (`services/auth-service`): **Hono + Valibot on Cloudflare Workers** — JWT auth (Web Crypto API), user registration/login. Deploy with `pnpm --filter @workspace/auth-service deploy`.
- **Page Service** (`services/page-service`): **Hono + Valibot on Cloudflare Workers** — page CRUD with auth middleware. Deploy with `pnpm --filter @workspace/page-service deploy`.
- **Block Service** (`services/block-service`): **Hono + Valibot on Cloudflare Workers** — content blocks CRUD with auth middleware. Deploy with `pnpm --filter @workspace/block-service deploy`.
- **File Service** (`services/file-service`): **Hono + Valibot on Cloudflare Workers** — Cloudinary upload via REST API (fetch-based, no SDK). Deploy with `pnpm --filter @workspace/file-service deploy`.

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
- `PUBLIC_HOCUSPOCUS_URL` — WebSocket URL for Hocuspocus real-time server
- `JWT_SECRET` — Secret for JWT signing
- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)

## Running

```bash
bash start.sh
```

This starts all microservices in parallel and then the SvelteKit dev server.

## User Preferences

- Monorepo structure with pnpm workspaces
- Bun runtime for backend microservices
- SvelteKit for frontend
