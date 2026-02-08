/**
 * Post-build copy script
 *
 * electron-builder strips node_modules from extraResources.
 * This script copies them back after building.
 */
const fs = require('fs');
const path = require('path');

const standaloneSrc = path.join(__dirname, '..', '.standalone-build');
const appStandalone = path.join(__dirname, '..', 'dist', 'mac-arm64', 'Claude Settings.app', 'Contents', 'Resources', 'standalone');

function copyRecursive(src, dest) {
  const stat = fs.lstatSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// Copy node_modules
const nmSrc = path.join(standaloneSrc, 'node_modules');
const nmDest = path.join(appStandalone, 'node_modules');
if (fs.existsSync(nmSrc) && !fs.existsSync(nmDest)) {
  console.log('Copying node_modules to app bundle...');
  copyRecursive(nmSrc, nmDest);
}

// Copy .next
const nextSrc = path.join(standaloneSrc, '.next');
const nextDest = path.join(appStandalone, '.next');
if (fs.existsSync(nextSrc)) {
  console.log('Copying .next to app bundle...');
  if (fs.existsSync(nextDest)) {
    fs.rmSync(nextDest, { recursive: true });
  }
  copyRecursive(nextSrc, nextDest);
}

console.log('Post-build copy complete.');
