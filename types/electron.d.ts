export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string; releaseUrl: string; currentVersion: string; significantlyOutdated: boolean }
  | { state: 'up-to-date' }
  | { state: 'error'; message: string };

export interface ElectronAPI {
  platform: string;
  isElectron: boolean;
  checkForUpdates: () => Promise<UpdateStatus>;
  getUpdateStatus: () => Promise<UpdateStatus>;
  getAppVersion: () => Promise<string>;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void;
  signalRendererReady: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
