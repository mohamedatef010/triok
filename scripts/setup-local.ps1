<#
.SYNOPSIS
Local Development Environment Setup Script for Video Courses Platform
#>

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Video Courses - Local Setup (DevOps) " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Docker
Write-Host "[1/8] Checking Docker..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH. Please install Docker Desktop and try again."
    exit 1
}
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
}
Write-Host "[OK] Docker is installed and running." -ForegroundColor Green
Write-Host ""

# 2. Check FFmpeg (warning only, not fatal)
Write-Host "[2/8] Checking FFmpeg..." -ForegroundColor Yellow
if (!(Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "[WARN] FFmpeg is not found in PATH. Video processing features may not work." -ForegroundColor Yellow
    Write-Host "       To install: winget install Gyan.FFmpeg  (then restart terminal)" -ForegroundColor Cyan
} else {
    Write-Host "[OK] FFmpeg is installed." -ForegroundColor Green
}
Write-Host ""

# 3. Copy .env files
Write-Host "[3/8] Setting up environment variables..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] Created .env from .env.example" -ForegroundColor Green
} else {
    Write-Host "[OK] .env file already exists, skipping." -ForegroundColor Green
}

$apiEnvDir = ".\artifacts\api-server"
if (!(Test-Path $apiEnvDir)) {
    New-Item -ItemType Directory -Path $apiEnvDir -Force | Out-Null
    Write-Host "[OK] Created directory: $apiEnvDir" -ForegroundColor Green
}
if (!(Test-Path "$apiEnvDir\.env")) {
    Copy-Item ".env.example" "$apiEnvDir\.env"
    Write-Host "[OK] Created artifacts/api-server/.env from .env.example" -ForegroundColor Green
} else {
    Write-Host "[OK] artifacts/api-server/.env already exists, skipping." -ForegroundColor Green
}
Write-Host ""

# 4. Start Docker Compose (run from project root where docker-compose.yml lives)
Write-Host "[4/8] Starting Docker Compose services..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker Compose failed to start. Check the output above."
    exit 1
}
Write-Host "[OK] Docker Compose services started." -ForegroundColor Green
Write-Host ""

# 5. Wait for Health Checks
Write-Host "[5/8] Waiting for MinIO and PostgreSQL to be ready (this may take a minute)..." -ForegroundColor Yellow
$postgresReady = $false
$minioReady    = $false

for ($i = 0; $i -lt 30; $i++) {
    $postgresStatus = docker inspect --format="{{json .State.Health.Status}}" video-courses-postgres 2>$null
    $minioStatus    = docker inspect --format="{{json .State.Health.Status}}" video-courses-minio    2>$null

    if ($postgresStatus -match '"healthy"') { $postgresReady = $true }
    if ($minioStatus    -match '"healthy"') { $minioReady    = $true }

    if ($postgresReady -and $minioReady) { break }

    Start-Sleep -Seconds 2
    Write-Host "." -NoNewline
}
Write-Host ""
Write-Host ""

if (!($postgresReady -and $minioReady)) {
    Write-Host "[WARN] Services health status:" -ForegroundColor Yellow
    Write-Host "  PostgreSQL ready: $postgresReady"
    Write-Host "  MinIO ready:      $minioReady"
    Write-Host "  Continuing anyway - services may still be starting up." -ForegroundColor Cyan
} else {
    Write-Host "[OK] All services are healthy." -ForegroundColor Green
}
Write-Host ""

# 6. Setup MinIO Bucket & CORS
Write-Host "[6/8] Configuring MinIO Bucket and CORS..." -ForegroundColor Yellow
$env:AWS_ACCESS_KEY_ID     = "minioadmin"
$env:AWS_SECRET_ACCESS_KEY = "minioadmin123"

# Temporarily allow non-zero exit codes (Docker prints info to stderr)
$ErrorActionPreference = "Continue"

try {
    Write-Host "  Pulling amazon/aws-cli image (first time may take a moment)..." -ForegroundColor Gray
    docker pull amazon/aws-cli 2>&1 | Out-Null

    # Create bucket (ignore error if already exists)
    & docker run --rm `
        -e AWS_ACCESS_KEY_ID=minioadmin `
        -e AWS_SECRET_ACCESS_KEY=minioadmin123 `
        amazon/aws-cli `
        --endpoint-url http://host.docker.internal:9000 `
        s3api create-bucket --bucket videos-dev 2>&1 | Out-Null

    # Apply CORS if cors.json exists
    if (Test-Path ".\scripts\cors.json") {
        $corsPath = (Resolve-Path ".\scripts\cors.json").Path -replace '\\', '/'
        & docker run --rm `
            -e AWS_ACCESS_KEY_ID=minioadmin `
            -e AWS_SECRET_ACCESS_KEY=minioadmin123 `
            -v "${corsPath}:/cors.json" `
            amazon/aws-cli `
            --endpoint-url http://host.docker.internal:9000 `
            s3api put-bucket-cors --bucket videos-dev --cors-configuration file:///cors.json 2>&1 | Out-Null
    }

    Write-Host "[OK] MinIO bucket 'videos-dev' configured." -ForegroundColor Green
} catch {
    Write-Host "[WARN] MinIO bucket auto-setup failed: $_" -ForegroundColor Yellow
    Write-Host "       Configure manually at: http://localhost:9001  (minioadmin / minioadmin123)" -ForegroundColor Cyan
    Write-Host "       Create bucket named: videos-dev" -ForegroundColor Cyan
}

$ErrorActionPreference = "Stop"
Write-Host ""

# 7. Install Dependencies
Write-Host "[7/8] Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
Write-Host "[OK] Dependencies installed." -ForegroundColor Green
Write-Host ""

# 8. Database Migrations
Write-Host "[8/8] Running Database Migrations..." -ForegroundColor Yellow
npm run -w @workspace/db db:push
Write-Host "[OK] Migrations completed." -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Setup Completed Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Services available at:"
Write-Host "  - MinIO Console : http://localhost:9001  (minioadmin / minioadmin123)"
Write-Host "  - PostgreSQL    : localhost:5034"
Write-Host "  - Redis         : localhost:6379"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  Run '.\scripts\start-local.ps1' to start the development servers." -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
