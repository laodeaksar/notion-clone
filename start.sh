#!/bin/bash
set -e

export DATABASE_URL="${DATABASE_URL}"
export JWT_SECRET="${JWT_SECRET:-dev-secret}"

# Start microservices in background
PORT=8081 bun run services/block-service/src/index.ts &
PORT=8082 bun run services/page-service/src/index.ts &
PORT=8083 bun run services/auth-service/src/index.ts &
PORT=1234 bun run services/hocuspocus-service/src/index.ts &

# Start api-gateway
PORT=8080 bun run apps/api-gateway/src/index.ts &

# Wait for backend services to be ready
sleep 3

# Start SvelteKit frontend
cd apps/web && pnpm dev
