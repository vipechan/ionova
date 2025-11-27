@echo off
REM Ionova Windows Deployment Script
REM Run as Administrator

echo ========================================
echo   Ionova Blockchain - Windows Setup
echo ========================================
echo.

echo [1/5] Checking for Rust...
where cargo >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Rust not found. Installing...
    echo Please download from: https://rustup.rs/
    echo After installation, restart this script.
    pause
    exit /b 1
) else (
    echo Rust is installed
)

echo.
echo [2/5] Checking for Docker...
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Docker not found. Installing...
    echo Please download Docker Desktop from: https://www.docker.com/products/docker-desktop/
    echo After installation, restart this script.
    pause
    exit /b 1
) else (
    echo Docker is installed
)

echo.
echo [3/5] Building Rust node...
cd node
cargo build --release
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed!
    echo.
    echo Common fixes:
    echo 1. Install Visual Studio Build Tools
    echo    Download: https://visualstudio.microsoft.com/downloads/
    echo    Select: Desktop development with C++
    echo.
    echo 2. Or use Developer Command Prompt
    echo    Open: Developer Command Prompt for VS 2022
    echo    Then run this script again
    echo.
    pause
    exit /b 1
)
cd ..

echo.
echo [4/5] Starting Docker devnet...
cd devnet
docker compose up -d
cd ..

echo.
echo [5/5] Deployment complete!
echo.
echo ========================================
echo   Ionova is Running!
echo ========================================
echo.
echo RPC Endpoints:
echo   Shard 0: http://localhost:27000
echo   Shard 1: http://localhost:27100
echo   ... (shards 2-7 on ports 27200-27700)
echo.
echo Monitoring:
echo   Grafana:    http://localhost:3000
echo   Prometheus: http://localhost:9090
echo.
echo View logs:
echo   docker compose -f devnet/docker-compose.yml logs -f
echo.
echo Stop devnet:
echo   docker compose -f devnet/docker-compose.yml down
echo.
echo ========================================

pause
