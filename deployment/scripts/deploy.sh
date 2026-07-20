#!/bin/bash
# SmartWaste — One-command deployment script
# Usage: bash deploy.sh [prod|staging]
set -e

ENV=${1:-prod}
echo ""
echo "═══════════════════════════════════════════"
echo "  🚀 SmartWaste Deployment — $ENV"
echo "═══════════════════════════════════════════"

cd "$(dirname "$0")/../.."

# 1. Pull latest
echo "📦 Pulling latest code from GitHub..."
git pull origin main

# 2. Check .env
if [ ! -f deployment/.env ]; then
  cp deployment/.env.example deployment/.env 2>/dev/null || true
  echo ""
  echo "⚠️  No .env found — created from example."
  echo "    Edit deployment/.env with real secrets, then re-run."
  exit 1
fi

# 3. Build and start all containers
echo "🐳 Building Docker images..."
cd deployment
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# 4. Wait for DB
echo "⏳ Waiting for database..."
sleep 8

# 5. Health checks
echo ""
echo "🔍 Running health checks..."
check() {
  if curl -sf "$1" > /dev/null 2>&1; then
    echo "  ✅ $2 is healthy"
  else
    echo "  ❌ $2 not responding at $1"
  fi
}
check "http://localhost:5000/health" "Node.js API"
check "http://localhost:8000/health" "AI Service"
check "http://localhost"             "Nginx"

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Deployment complete!"
echo ""
echo "  API:       http://localhost:5000"
echo "  AI Docs:   http://localhost:8000/docs"
echo "  Admin:     open frontend/admin/IV_Admin.html"
echo "  Analytics: open frontend/analytics/index.html"
echo "  AI Demo:   open frontend/ai-demo/index.html"
echo "═══════════════════════════════════════════"
echo ""
docker-compose ps
