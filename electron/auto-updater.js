/**
 * Auto-Updater Module
 *
 * Checks for updates using the GitHub Releases API and notifies users
 * when a new version is available. Users manually install updates via
 * the one-line curl command.
 */

const { app, ipcMain } = require('electron');
const https = require('https');

const GITHUB_OWNER = 'cameronfleet-paxos';
const GITHUB_REPO = 'claude-settings-manager';

let mainWindow = null;
let periodicCheckInterval = null;
let currentStatus = { state: 'idle' };

// Check interval: 10 minutes
const CHECK_INTERVAL_MS = 10 * 60 * 1000;

// Delay before first check on launch: 5 seconds
const LAUNCH_CHECK_DELAY_MS = 5000;

/**
 * Set the main window reference for IPC communication
 */
function setAutoUpdaterWindow(window) {
  mainWindow = window;
}

/**
 * Send update status to renderer
 */
function sendStatusToRenderer(status) {
  currentStatus = status;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', status);
  }
}

/**
 * Get the current app version
 */
function getAppVersion() {
  return app.getVersion();
}

/**
 * Compare two semver versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1, v2) {
  const clean1 = v1.replace(/^v/, '');
  const clean2 = v2.replace(/^v/, '');

  const parts1 = clean1.split('.').map(Number);
  const parts2 = clean2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Check if the version is significantly outdated
 */
function isSignificantlyOutdated(currentVersion, latestVersion) {
  const parts1 = currentVersion.replace(/^v/, '').split('.').map(Number);
  const parts2 = latestVersion.replace(/^v/, '').split('.').map(Number);

  const majorDiff = (parts2[0] || 0) - (parts1[0] || 0);
  const minorDiff = (parts2[1] || 0) - (parts1[1] || 0);

  return majorDiff > 0 || minorDiff > 1;
}

/**
 * Fetch the latest release from GitHub API
 */
async function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      method: 'GET',
      headers: {
        'User-Agent': `ClaudeSettings/${getAppVersion()}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 404) {
          resolve(null);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`GitHub API returned status ${res.statusCode}`));
          return;
        }
        try {
          const release = JSON.parse(data);
          resolve({
            version: release.tag_name,
            releaseUrl: release.html_url,
          });
        } catch (e) {
          reject(new Error('Failed to parse GitHub response'));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.end();
  });
}

/**
 * Check for updates
 */
async function checkForUpdates() {
  sendStatusToRenderer({ state: 'checking' });

  try {
    const latestRelease = await fetchLatestRelease();

    if (!latestRelease) {
      const status = { state: 'up-to-date' };
      sendStatusToRenderer(status);
      return status;
    }

    const currentVersion = getAppVersion();
    const latestVersion = latestRelease.version.replace(/^v/, '');

    if (compareVersions(latestVersion, currentVersion) > 0) {
      const significantlyOutdated = isSignificantlyOutdated(currentVersion, latestVersion);
      const status = {
        state: 'available',
        version: latestVersion,
        releaseUrl: latestRelease.releaseUrl,
        currentVersion,
        significantlyOutdated,
      };
      sendStatusToRenderer(status);
      return status;
    } else {
      const status = { state: 'up-to-date' };
      sendStatusToRenderer(status);
      return status;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AutoUpdater] Error checking for updates:', message);
    const status = { state: 'error', message };
    sendStatusToRenderer(status);
    return status;
  }
}

/**
 * Initialize the auto-updater - register IPC handlers
 */
function initAutoUpdater() {
  // Handle renderer-ready signal to re-send current status
  ipcMain.on('renderer-ready', () => {
    if (currentStatus.state !== 'idle') {
      sendStatusToRenderer(currentStatus);
    }
  });

  ipcMain.handle('check-for-updates', async () => {
    return await checkForUpdates();
  });

  ipcMain.handle('get-update-status', () => {
    return currentStatus;
  });

  ipcMain.handle('get-app-version', () => {
    return getAppVersion();
  });
}

/**
 * Check for updates on launch (with delay)
 */
function checkForUpdatesOnLaunch() {
  setTimeout(async () => {
    try {
      await checkForUpdates();
    } catch (error) {
      console.error('[AutoUpdater] Launch check failed:', error);
    }
  }, LAUNCH_CHECK_DELAY_MS);
}

/**
 * Start periodic update checks
 */
function startPeriodicChecks() {
  if (periodicCheckInterval) return;

  periodicCheckInterval = setInterval(async () => {
    try {
      await checkForUpdates();
    } catch (error) {
      console.error('[AutoUpdater] Periodic check failed:', error);
    }
  }, CHECK_INTERVAL_MS);
}

/**
 * Stop periodic update checks
 */
function stopPeriodicChecks() {
  if (periodicCheckInterval) {
    clearInterval(periodicCheckInterval);
    periodicCheckInterval = null;
  }
}

module.exports = {
  initAutoUpdater,
  setAutoUpdaterWindow,
  checkForUpdatesOnLaunch,
  startPeriodicChecks,
  stopPeriodicChecks,
};
