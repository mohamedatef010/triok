<#
.SYNOPSIS
Local Development Server Startup Script
#>

Write-Host "Starting Docker Compose services..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "Starting API Server and Frontend in Development Mode..." -ForegroundColor Yellow
Write-Host "This will start Vite on port 5000 and Express on port 3000." -ForegroundColor Cyan
pnpm --parallel --filter "@workspace/video-courses" --filter "@workspace/api-server" run dev
