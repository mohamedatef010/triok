#!/usr/bin/env bash
# ==============================================================================
# Automated Deployment Script for Beget VPS
# Domain: классный-фокус.рф (xn----7sb1acdcpkxafxk9g.xn--p1ai)
# Server IP: 5.35.87.221
# ==============================================================================

set -e

echo "🚀 [1/8] Navigating to project directory..."
cd /var/www/video-courses

echo "📥 [2/8] Pulling latest changes from GitHub..."
git pull origin main

echo "📦 [3/8] Checking Docker containers and MinIO buckets..."
if command -v docker >/dev/null 2>&1; then
  if ! docker ps | grep -q "video-courses-postgres"; then
    echo "Starting Docker services..."
    docker-compose up -d || docker compose up -d
  fi

  # Initialize MinIO buckets and public read download permissions
  echo "Configuring MinIO buckets..."
  docker exec video-courses-minio sh -c "
    mc alias set local http://localhost:9000 minioadmin minioadmin123 &&
    mc mb local/videos-prod --ignore-existing &&
    mc mb local/videos-dev --ignore-existing &&
    mc mb local/video-courses --ignore-existing &&
    mc anonymous set download local/videos-prod &&
    mc anonymous set download local/videos-dev &&
    mc anonymous set download local/video-courses
  " 2>/dev/null || true
fi

# Ensure temp directory for video processing exists
sudo mkdir -p /var/tmp/video-processing
sudo chmod 777 /var/tmp/video-processing

echo "🛠️ [4/8] Installing dependencies..."
pnpm install

echo "🗄️ [5/8] Applying database schema migrations..."
pnpm --filter @workspace/db run push

echo "👤 [6/8] Ensuring default admin account exists..."
pnpm --filter @workspace/scripts run seed-admin || true

echo "🏗️ [7/8] Building Frontend and Backend applications..."
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/video-courses run build

echo "🌐 [8/8] Updating Nginx and restarting PM2 process..."
if [ -f /etc/nginx/sites-available/video-courses.conf ]; then
  sudo cp deployment/nginx.conf /etc/nginx/sites-available/video-courses.conf
  sudo nginx -t && sudo systemctl reload nginx || sudo systemctl restart nginx
fi

# Restart API server via PM2 ecosystem
pm2 restart ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "=============================================================================="
echo "✅ Deployment completed successfully!"
echo "🌐 Website URL: https://классный-фокус.рф (https://xn----7sb1acdcpkxafxk9g.xn--p1ai)"
echo "🔑 Admin Login: admin@videomontazh.ru"
echo "=============================================================================="
