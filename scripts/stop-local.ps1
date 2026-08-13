<#
.SYNOPSIS
Local Development Server Stop Script
#>

param(
    [switch]$CleanAll
)

Write-Host "Stopping Docker Compose services..." -ForegroundColor Yellow
Set-Location ..

if ($CleanAll) {
    Write-Host "Cleaning all containers, networks, and VOLUMES..." -ForegroundColor Red
    docker-compose down -v
} else {
    docker-compose stop
}

Write-Host "Cleaning temporary video processing files..." -ForegroundColor Yellow
$tmpPath = "/tmp/video-processing" # From .env.example
if (Test-Path $tmpPath) {
    Remove-Item -Recurse -Force $tmpPath
    Write-Host "✅ Temporary files removed." -ForegroundColor Green
}

Write-Host "✅ Local environment stopped successfully." -ForegroundColor Green
