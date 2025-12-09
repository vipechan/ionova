@echo off
echo Copying deployment script to VPS...
scp f:\ionova\deploy-ionova.sh root@72.61.210.50:/root/
if %ERRORLEVEL% NEQ 0 (
    echo SCP failed. Please check your password and try again.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Running deployment script on VPS...
ssh root@72.61.210.50 "bash /root/deploy-ionova.sh"
pause
