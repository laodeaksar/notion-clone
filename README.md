# Notion Clone (monorepo)

Quick start:

1. Copy env vars: `cp .env.example .env`
2. Install dependencies: `pnpm install`
3. Start dev services via Docker Compose: `docker compose up -d`
4. Run dev: `pnpm dev`

Services:
- `apps/web` — SvelteKit frontend
- `apps/api-gateway` — Cloudflare-compatible API gateway skeleton
- `services/auth-service` — Bun + Elysia auth microservice
- `services/page-service` — Bun + Elysia page metadata microservice
- `services/block-service` — Bun + Elysia block microservice
- `services/file-service` — Bun + Elysia Cloudinary upload microservice
- `packages/db` — Drizzle schema
# shadcn/ui monorepo template

This is a TanStack Start monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```
