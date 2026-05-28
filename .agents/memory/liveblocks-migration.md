---
name: Liveblocks migration
description: PartyKit replaced with Liveblocks for real-time Yjs collaboration. Key files and decisions.
---

# Liveblocks Migration

## What changed
- `services/partykit-service` repurposed: now a Hono/Node server (not PartyKit) that is no longer started (auth is handled directly in SvelteKit)
- Real-time auth endpoint moved to SvelteKit: `apps/web/src/routes/api/liveblocks-auth/+server.ts`
- Frontend (`Editor.svelte`) uses `@liveblocks/client` + `@liveblocks/yjs` (LiveblocksProvider) instead of `YPartyKitProvider`
- `start.sh` no longer starts partykit-service process
- `PUBLIC_PARTYKIT_HOST`, `PUBLIC_HOCUSPOCUS_URL` env vars removed
- `partyKitHost` prop removed from layout.server.ts and app.d.ts

## Auth flow
1. Browser editor calls `POST /api/liveblocks-auth` with session cookie
2. SvelteKit server validates session against auth-service
3. Calls `https://api.liveblocks.io/v2/identify-user` with `LIVEBLOCKS_SECRET_KEY`
4. Returns Liveblocks JWT to the client

## Required secret
- `LIVEBLOCKS_SECRET_KEY` — from liveblocks.io dashboard, starts with `sk_dev_...` or `sk_prod_...`

**Why:** PartyKit's `workerd`/miniflare runtime can't start in Replit sandbox; Liveblocks is a hosted service with no self-hosted process required.
