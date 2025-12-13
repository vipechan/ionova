@echo off
echo ========================================
echo   Quick Deploy to VPS
echo ========================================
echo.
echo This will copy the website directly to /var/www/html
echo You'll need to enter the SSH password once.
echo.
pause

echo Copying website files to VPS...
scp -r next_steps\website\dist root@72.61.210.50:/var/www/html/

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Website is now live at:
echo   http://72.61.210.50
echo.
pause
