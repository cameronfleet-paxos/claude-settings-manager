/**
 * Create DMG from the built .app directory
 *
 * Since we need to post-process the .app (copy node_modules back after
 * electron-builder strips them), we build as --dir first, fix the bundle,
 * then create the DMG using hdiutil.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const pkg = require(path.join(__dirname, '..', 'package.json'));
const version = pkg.version;
const appName = 'Claude Settings';
const dmgName = `Claude-Settings-${version}-arm64.dmg`;
const distDir = path.join(__dirname, '..', 'dist');
const appPath = path.join(distDir, 'mac-arm64', `${appName}.app`);
const dmgPath = path.join(distDir, dmgName);

if (!fs.existsSync(appPath)) {
  console.error(`App not found at: ${appPath}`);
  process.exit(1);
}

// Remove existing DMG
if (fs.existsSync(dmgPath)) {
  fs.unlinkSync(dmgPath);
}

console.log(`Creating DMG: ${dmgName}...`);

// Create DMG using hdiutil
execSync(
  `hdiutil create -volname "${appName}" -srcfolder "${appPath}" -ov -format UDZO "${dmgPath}"`,
  { stdio: 'inherit' }
);

console.log(`DMG created: ${dmgPath}`);
