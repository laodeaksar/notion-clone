#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $1"; }
fail() { echo -e "${RED}[deploy]${NC} $1"; exit 1; }

usage() {
  echo ""
  echo "Usage: bash deploy.sh [target]"
  echo ""
  echo "Targets:"
  echo "  all         Deploy semua services secara berurutan (default)"
  echo "  services    Deploy hanya backend services (auth, block, page, file)"
  echo "  gateway     Deploy hanya API gateway"
  echo "  web         Deploy hanya SvelteKit frontend ke Cloudflare Pages"
  echo "  auth        Deploy hanya auth-service"
  echo "  block       Deploy hanya block-service"
  echo "  page        Deploy hanya page-service"
  echo "  file        Deploy hanya file-service"
  echo ""
}

deploy_auth() {
  log "Deploying auth-service..."
  pnpm --filter @workspace/auth-service deploy
  log "auth-service deployed."
}

deploy_block() {
  log "Deploying block-service..."
  pnpm --filter @workspace/block-service deploy
  log "block-service deployed."
}

deploy_page() {
  log "Deploying page-service..."
  pnpm --filter @workspace/page-service deploy
  log "page-service deployed."
}

deploy_file() {
  log "Deploying file-service..."
  pnpm --filter @workspace/file-service deploy
  log "file-service deployed."
}

deploy_gateway() {
  log "Deploying api-gateway..."
  pnpm --filter @workspace/api-gateway deploy
  log "api-gateway deployed."
}

deploy_web() {
  log "Building & deploying web ke Cloudflare Pages..."
  pnpm --filter @workspace/web deploy:pages
  log "web deployed."
}

deploy_services() {
  log "=== Deploying backend services ==="
  deploy_auth
  deploy_block
  deploy_page
  deploy_file
  log "=== Semua backend services selesai ==="
}

deploy_all() {
  echo ""
  log "========================================"
  log "  Memulai full deployment ke Cloudflare  "
  log "========================================"
  echo ""

  # Step 1: Backend services (urutan: auth → block → page → file)
  log "Step 1/3 — Backend services"
  deploy_services
  echo ""

  # Step 2: API Gateway (butuh URL services sudah live)
  log "Step 2/3 — API Gateway"
  deploy_gateway
  echo ""

  # Step 3: Web frontend (butuh URL gateway sudah live)
  log "Step 3/3 — Web frontend"
  deploy_web
  echo ""

  log "========================================"
  log "  Deployment selesai!                   "
  log "========================================"
}

TARGET="${1:-all}"

case "$TARGET" in
  all)      deploy_all ;;
  services) deploy_services ;;
  gateway)  deploy_gateway ;;
  web)      deploy_web ;;
  auth)     deploy_auth ;;
  block)    deploy_block ;;
  page)     deploy_page ;;
  file)     deploy_file ;;
  --help|-h) usage ;;
  *) fail "Target tidak dikenal: '$TARGET'. Gunakan --help untuk melihat opsi." ;;
esac
