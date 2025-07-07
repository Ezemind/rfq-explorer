#!/bin/bash

echo "================================================"
echo " RFQ Explorer - Quick Installer Builder"
echo "================================================"
echo

echo "[1/5] Installing dependencies..."
npm install

echo
echo "[2/5] Installing electron-updater..."
npm install electron-updater --save

echo
echo "[3/5] Building React application..."
npm run build

echo
echo "[4/5] Building Electron installer..."
npm run dist

echo
echo "[5/5] Installation complete!"
echo
echo "The installer has been created in the 'dist' folder."
echo
echo "Next steps:"
echo "1. Create icons in the 'assets' folder (icon.ico, icon.png, icon.icns)"
echo "2. Setup GitHub repository for auto-updates"
echo "3. Configure GitHub secrets for releases"
echo
echo "See DEPLOYMENT_GUIDE.md for detailed instructions."
echo
