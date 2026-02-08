#!/bin/bash
# Build and deploy the Electron app to local Applications folder
set -e

cd "$(dirname "$0")/.."

# Clean previous build artifacts to avoid code signing issues
echo "Cleaning build artifacts..."
rm -rf dist .standalone-build .next

# Build the app (using --dir for faster local builds, no DMG needed)
echo "Building Electron app..."
pnpm electron:build:dir

# Deploy to Applications
echo "Deploying to ~/Applications..."
mkdir -p ~/Applications
rm -rf ~/Applications/Claude\ Settings.app
cp -R dist/mac-arm64/Claude\ Settings.app ~/Applications/
echo "Deployed Claude Settings.app to ~/Applications"
