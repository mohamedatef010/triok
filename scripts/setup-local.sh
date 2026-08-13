#!/bin/bash
set -e

echo -e "\033[1;36m==========================================\033[0m"
echo -e "\033[1;36m Video Courses - Local Setup (DevOps) \033[0m"
echo -e "\033[1;36m==========================================\033[0m\n"

# 1. Check Docker
echo -e "\033[1;33m[1/8] Checking Docker...\033[0m"
if ! command -v docker &> /dev/null; then
    echo -e "\033[1;31m❌ Docker is not installed or not in PATH. Please install Docker Desktop and try again.\033[0m"
    exit 1
fi
if ! docker info >/dev/null 2>&1; then
    echo -e "\033[1;31m❌ Docker is not running. Please start Docker Desktop and try again.\033[0m"
    exit 1
fi
echo -e "\033[1;32m✅ Docker is installed and running.\033[0m\n"

# 2. Check FFmpeg
echo -e "\033[1;33m[2/8] Checking FFmpeg...\033[0m"
if ! command -v ffmpeg &> /dev/null; then
    echo -e "\033[1;31m❌ FFmpeg is not installed or not in PATH.\033[0m"
    echo -e "\033[1;36mTo install on macOS using Homebrew:\033[0m brew install ffmpeg"
    echo -e "\033[1;36mTo install on Ubuntu/Debian:\033[0m sudo apt update && sudo apt install ffmpeg"
    echo -e "After installation, run this script again."
    exit 1
fi
echo -e "\033[1;32m✅ FFmpeg is installed.\033[0m\n"

# 3. Copy .env
echo -e "\033[1;33m[3/8] Setting up environment variables...\033[0m"
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "\033[1;32m✅ Created .env from .env.example\033[0m"
else
    echo -e "\033[1;32m✅ .env file already exists, skipping.\033[0m"
fi

if [ ! -f artifacts/api-server/.env ]; then
    cp .env.example artifacts/api-server/.env
    echo -e "\033[1;32m✅ Created artifacts/api-server/.env from .env.example\033[0m"
fi
echo ""

# 4. Start Docker Compose
echo -e "\033[1;33m[4/8] Starting Docker Compose services...\033[0m"
docker-compose up -d
echo -e "\033[1;32m✅ Docker Compose services started.\033[0m\n"

# 5. Wait for Health Checks
echo -e "\033[1;33m[5/8] Waiting for MinIO and PostgreSQL to be ready...\033[0m"
POSTGRES_READY=0
MINIO_READY=0

for i in {1..30}; do
    postgres_status=$(docker inspect --format="{{json .State.Health.Status}}" video-courses-postgres 2>/dev/null || true)
    minio_status=$(docker inspect --format="{{json .State.Health.Status}}" video-courses-minio 2>/dev/null || true)
    
    if [[ "$postgres_status" == '"healthy"' ]]; then POSTGRES_READY=1; fi
    if [[ "$minio_status" == '"healthy"' ]]; then MINIO_READY=1; fi
    
    if [ $POSTGRES_READY -eq 1 ] && [ $MINIO_READY -eq 1 ]; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

if [ $POSTGRES_READY -eq 0 ] || [ $MINIO_READY -eq 0 ]; then
    echo -e "\033[1;31m❌ Services did not become healthy in time. Check docker logs.\033[0m"
    exit 1
fi
echo -e "\033[1;32m✅ Services are ready.\033[0m\n"

# 6. Setup MinIO Bucket & CORS
echo -e "\033[1;33m[6/8] Configuring MinIO Bucket and CORS...\033[0m"
DOCKER_CMD="docker run --rm -e AWS_ACCESS_KEY_ID=minioadmin -e AWS_SECRET_ACCESS_KEY=minioadmin123 --network host -v $(pwd)/scripts/cors.json:/cors.json amazon/aws-cli"

# On linux --network host allows localhost:9000 to work
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS docker Desktop uses host.docker.internal
    ENDPOINT="http://host.docker.internal:9000"
else
    ENDPOINT="http://localhost:9000"
fi

$DOCKER_CMD --endpoint-url $ENDPOINT s3api create-bucket --bucket videos-dev >/dev/null 2>&1 || true
$DOCKER_CMD --endpoint-url $ENDPOINT s3api put-bucket-cors --bucket videos-dev --cors-configuration file:///cors.json >/dev/null 2>&1 || true
echo -e "\033[1;32m✅ MinIO bucket 'videos-dev' created and CORS configured.\033[0m\n"

# 7. Install Dependencies
echo -e "\033[1;33m[7/8] Installing Node.js dependencies...\033[0m"
npm install
echo -e "\033[1;32m✅ Dependencies installed.\033[0m\n"

# 8. Database Migrations
echo -e "\033[1;33m[8/8] Running Database Migrations...\033[0m"
npm run -w @workspace/db db:push
echo -e "\033[1;32m✅ Migrations completed.\033[0m\n"

echo -e "\033[1;36m==========================================\033[0m"
echo -e "\033[1;32m🎉 Setup Completed Successfully!\033[0m\n"
echo -e "Services available at:"
echo -e " - MinIO Console: http://localhost:9001 (minioadmin / minioadmin123)"
echo -e " - PostgreSQL:    localhost:5034"
echo -e " - Redis:         localhost:6379\n"
echo -e "\033[1;33mNext steps:\033[0m"
echo -e " Run './scripts/start-local.sh' to start the development servers."
echo -e "\033[1;36m==========================================\033[0m"
