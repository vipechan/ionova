@echo off
echo ========================================
echo   Deploying Ionova Frontend to VPS (Optimized)
echo ========================================
echo.

echo [1/4] Building frontend locally...
cd next_steps\website
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
cd ..\..

echo.
echo [2/4] Copying deployment script to VPS...
scp deploy_frontend.sh root@72.61.210.50:/root/
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: SCP failed. Please check your SSH connection.
    pause
    exit /b 1
)

echo.
echo [3/4] Copying built assets to VPS...
echo Copying dist folder...
ssh root@72.61.210.50 "rm -rf /root/dist_temp && mkdir -p /root/dist_temp"
scp -r next_steps\website\dist\* root@72.61.210.50:/root/dist_temp/
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: File copy failed. Trying to continue...
)

echo.
echo [4/4] Running deployment script on VPS...
ssh root@72.61.210.50 "bash /root/deploy_frontend.sh"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Deployment script failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Frontend is now accessible at:
echo   http://72.61.210.50
echo.
pause
