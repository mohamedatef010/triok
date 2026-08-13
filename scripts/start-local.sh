#!/bin/bash
set -e

echo -e "\033[1;33mStarting Docker Compose services...\033[0m"
cd "$(dirname "$0")/.."
docker-compose up -d

echo -e "\033[1;33mStarting API Server and Frontend in Development Mode...\033[0m"
echo -e "\033[1;36mThis will start Vite on port 5173 and Express on port 3000.\033[0m"
npm run dev
