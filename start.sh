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

# Write .dev.vars for each wrangler service so env vars are available at runtime
write_dev_vars() {
  local dir=$1
  cat > "$dir/.dev.vars" <<EOF
DATABASE_URL=${ACTIVE_DATABASE_URL:-}
JWT_SECRET=${JWT_SECRET:-dev-secret}
BETTER_AUTH_SECRET="${JWT_SECRET:-dev-secret}-notion-clone-better-auth-2024"
INTERNAL_SECRET=${INTERNAL_SECRET:-dev-internal-secret}
GATEWAY_ORIGIN=${GATEWAY_ORIGIN:-http://localhost:8080}
AUTH_REQUIRED=${AUTH_REQUIRED:-true}
PAGE_SERVICE_URL=${PAGE_SERVICE_URL:-http://localhost:8082}
AUTH_SERVICE_URL=${AUTH_SERVICE_URL:-http://localhost:8083}
BLOCK_SERVICE_URL=${BLOCK_SERVICE_URL:-http://localhost:8081}
FILE_SERVICE_URL=${FILE_SERVICE_URL:-http://localhost:8084}
ALLOWED_ORIGINS=${COMPUTED_ORIGINS}
EOF
}

write_dev_vars services/auth-service
write_dev_vars services/block-service
write_dev_vars services/page-service
write_dev_vars apps/api-gateway

# file-service also needs Cloudinary credentials (optional — service starts even without them)
cat > "services/file-service/.dev.vars" <<EOF
DATABASE_URL=${ACTIVE_DATABASE_URL:-}
JWT_SECRET=${JWT_SECRET:-dev-secret}
INTERNAL_SECRET=${INTERNAL_SECRET:-dev-internal-secret}
CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME:-}
CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY:-}
CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET:-}
EOF

echo "Starting microservices..."

# Help workerd (used by wrangler dev) find the system CA bundle for TLS verification
export SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

# Start CF Worker services via wrangler dev (local mode, no CF account needed)
# Each instance gets a unique --inspector-port to avoid port 9229 conflicts
(cd services/auth-service  && pnpm exec wrangler dev --port 8083 --inspector-port 9230 --show-interactive-dev-session=false 2>&1 | sed 's/^/[auth]    /') &
(cd services/block-service && pnpm exec wrangler dev --port 8081 --inspector-port 9231 --show-interactive-dev-session=false 2>&1 | sed 's/^/[block]   /') &
(cd services/page-service  && pnpm exec wrangler dev --port 8082 --inspector-port 9232 --show-interactive-dev-session=false 2>&1 | sed 's/^/[page]    /') &

# Hocuspocus runs as a plain Node server (not a CF Worker); must use node+tsx, not bun
(cd services/hocuspocus-service && PORT=1234 AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:8083}" REDIS_URL="${REDIS_URL:-}" AUTH_REQUIRED="${AUTH_REQUIRED:-true}" node --import tsx src/index.ts 2>&1 | sed 's/^/[hocus]   /') &

# File service via wrangler dev
(cd services/file-service && pnpm exec wrangler dev --port 8084 --inspector-port 9234 --show-interactive-dev-session=false 2>&1 | sed 's/^/[file]    /') &

# API gateway via wrangler dev
(cd apps/api-gateway && pnpm exec wrangler dev --port 8080 --inspector-port 9233 --show-interactive-dev-session=false 2>&1 | sed 's/^/[gateway] /') &

# Wait for backend services to be ready
echo "Waiting for services to start..."
sleep 8

# Start SvelteKit frontend
echo "Starting SvelteKit frontend..."
cd apps/web && pnpm dev
