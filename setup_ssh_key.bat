@echo off
echo ========================================
echo   Setting up SSH Key Authentication
echo ========================================
echo.
echo This will copy your SSH public key to the VPS
echo You will need to enter the password ONE TIME
echo.

set VPS_HOST=root@72.61.210.50
set SSH_KEY=%USERPROFILE%\.ssh\id_rsa.pub

echo Copying SSH key to VPS...
type %SSH_KEY% | ssh %VPS_HOST% "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SSH Key Setup Complete!
    echo ========================================
    echo.
    echo Testing passwordless authentication...
    ssh %VPS_HOST% "echo 'SSH key authentication is working!'"
    echo.
) else (
    echo ERROR: Failed to copy SSH key
    pause
    exit /b 1
)

pause
