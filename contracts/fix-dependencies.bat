@echo off
echo ========================================
echo Ionova Contracts - Dependency Fix
echo ========================================
echo.

echo [1/3] Cleaning old dependencies...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo Done.
echo.

echo [2/3] Installing dependencies...
call npm install --legacy-peer-deps
echo Done.
echo.

echo [3/3] Compiling contracts...
call npx hardhat compile
echo.

echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run tests: npx hardhat test
echo 2. Deploy KYC Airdrop: npx hardhat run scripts/deploy-kyc-airdrop.js --network ionova
echo.
pause
