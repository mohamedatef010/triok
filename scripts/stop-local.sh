#!/bin/bash
set -e

echo -e "\033[1;33mStopping Docker Compose services...\033[0m"
cd "$(dirname "$0")/.."

if [[ "$1" == "--clean-all" ]]; then
    echo -e "\033[1;31mCleaning all containers, networks, and VOLUMES...\033[0m"
    docker-compose down -v
else
    docker-compose stop
fi

echo -e "\033[1;33mCleaning temporary video processing files...\033[0m"
TMP_PATH="/tmp/video-processing"
if [ -d "$TMP_PATH" ]; then
    rm -rf "$TMP_PATH"
    echo -e "\033[1;32m✅ Temporary files removed.\033[0m"
fi

echo -e "\033[1;32m✅ Local environment stopped successfully.\033[0m"
