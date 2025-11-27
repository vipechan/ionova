#!/bin/bash

echo "========================================"
echo "Ionova Contracts - Dependency Fix"
echo "========================================"
echo ""

echo "[1/3] Cleaning old dependencies..."
rm -rf node_modules package-lock.json
echo "Done."
echo ""

echo "[2/3] Installing dependencies..."
npm install --legacy-peer-deps
echo "Done."
echo ""

echo "[3/3] Compiling contracts..."
npx hardhat compile
echo ""

echo "========================================"
echo "Fix Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Run tests: npx hardhat test"
echo "2. Deploy KYC Airdrop: npx hardhat run scripts/deploy-kyc-airdrop.js --network ionova"
echo ""
