#!/bin/bash
set -e

export JWT_SECRET="${JWT_SECRET:-dev-secret}"

# Use Neon database if NEON_DATABASE_URL is provided, otherwise fall back to local Postgres
if [ -n "$NEON_DATABASE_URL" ]; then
  echo "Using Neon database..."
  export ACTIVE_DATABASE_URL="$NEON_DATABASE_URL"
else
  export ACTIVE_DATABASE_URL="${DATABASE_URL:-}"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  pnpm install
fi

# Run database migrations
if [ -n "$ACTIVE_DATABASE_URL" ]; then
  echo "Running database migrations..."
  DATABASE_URL="$ACTIVE_DATABASE_URL" pnpm --filter @workspace/db migrate || echo "Migration skipped or already up to date."
  echo "Migrations done."
else
  echo "DATABASE_URL not set, skipping migrations."
fi

# Build allowed origins: always include localhost + Replit dev domain if available
REPLIT_ORIGIN=""
if [ -n "$REPLIT_DEV_DOMAIN" ]; then
  REPLIT_ORIGIN="https://${REPLIT_DEV_DOMAIN}"
fi

if [ -n "$ALLOWED_ORIGINS" ]; then
  COMPUTED_ORIGINS="$ALLOWED_ORIGINS"
elif [ -n "$REPLIT_ORIGIN" ]; then
  COMPUTED_ORIGINS="http://localhost:5000,${REPLIT_ORIGIN}"
else
  COMPUTED_ORIGINS="http://localhost:5000"
fi

# Export all env vars needed by Node.js services (read via process.env in server.node.ts)
export DATABASE_URL="${ACTIVE_DATABASE_URL:-}"
export BETTER_AUTH_SECRET="${JWT_SECRET:-dev-secret}-notion-clone-better-auth-2024"
export INTERNAL_SECRET="${INTERNAL_SECRET:-dev-internal-secret}"
export GATEWAY_ORIGIN="${GATEWAY_ORIGIN:-http://localhost:8080}"
export AUTH_REQUIRED="${AUTH_REQUIRED:-true}"
export PAGE_SERVICE_URL="${PAGE_SERVICE_URL:-http://localhost:8082}"
export AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:8083}"
export BLOCK_SERVICE_URL="${BLOCK_SERVICE_URL:-http://localhost:8081}"
export FILE_SERVICE_URL="${FILE_SERVICE_URL:-http://localhost:8084}"
export ALLOWED_ORIGINS="${COMPUTED_ORIGINS}"
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

echo "Starting microservices..."

# All backend services run as plain Node.js HTTP servers via @hono/node-server + tsx.
# This avoids Cloudflare workerd's cloudflare:sockets limitation with local PostgreSQL
# (workerd cannot reach Replit's 'helium' PostgreSQL hostname via TCP).
# For production deployment, wrangler deploy still targets CF Workers.
(cd services/auth-service  && PORT=8083 node --import tsx src/server.node.ts 2>&1 | sed 's/^/[auth]    /') &
(cd services/block-service && PORT=8081 node --import tsx src/server.node.ts 2>&1 | sed 's/^/[block]   /') &
(cd services/page-service  && PORT=8082 node --import tsx src/server.node.ts 2>&1 | sed 's/^/[page]    /') &
(cd services/file-service  && PORT=8084 node --import tsx src/server.node.ts 2>&1 | sed 's/^/[file]    /') &
(cd apps/api-gateway       && PORT=8080 node --import tsx src/server.node.ts 2>&1 | sed 's/^/[gateway] /') &

# Hocuspocus runs as a plain Node server (not a CF Worker); must use node+tsx, not bun
(cd services/hocuspocus-service && PORT=1234 AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:8083}" REDIS_URL="${REDIS_URL:-}" AUTH_REQUIRED="${AUTH_REQUIRED:-true}" node --import tsx src/index.ts 2>&1 | sed 's/^/[hocus]   /') &

# Wait for backend services to be ready
echo "Waiting for services to start..."
sleep 5

# Start SvelteKit frontend
echo "Starting SvelteKit frontend..."
cd apps/web && pnpm dev
