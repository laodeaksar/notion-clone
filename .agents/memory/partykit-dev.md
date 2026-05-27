---
name: PartyKit dev workaround
description: partykit dev (miniflare/workerd) fails in Replit background processes; use y-websocket as dev backend instead
---

## Rule
Never use `npx partykit dev` in `start.sh`. Use `node node_modules/y-websocket/bin/server.cjs` on port 1999 instead.

**Why:** `partykit dev` uses Miniflare (workerd) which throws `ERR_RUNTIME_FAILURE: The Workers runtime failed to start` when launched as a background process in Replit. It starts fine in a direct terminal session (with TTY) but fails when piped through `sed` in a shell subshell `&` background job. This is the same root cause as why `wrangler dev` doesn't work in Replit.

**How to apply:** In `start.sh`:
```bash
(cd services/partykit-service && HOST=0.0.0.0 PORT=1999 node node_modules/y-websocket/bin/server.cjs 2>&1 | sed 's/^/[partykit]/') &
```

`YPartyKitProvider` (client) is based on y-websocket and speaks the same Yjs sync protocol. The URL path `/parties/main/<roomId>` is used as the document name key on the y-websocket side — both agree on the same string so sync works correctly.

**Production:** `npx partykit deploy` (in CI) deploys to Cloudflare Durable Objects and works fine.

## Additional notes
- `y-partykit/server` export does NOT exist in v0.0.14 — import `onConnect` from `"y-partykit"` directly
- Client import is `import YPartyKitProvider from 'y-partykit/provider'` (not `'y-partykit'`)
- `onBeforeConnect` in the PartyKit class-based server MUST be `static`, not an instance method
- y-websocket binary is at `node_modules/y-websocket/bin/server.cjs` (not `server.js`)
