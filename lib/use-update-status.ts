import { useState, useEffect, useCallback } from 'react';
import type { UpdateStatus } from '@/types/electron';

export function useUpdateStatus() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    // Get initial status and version
    api.getUpdateStatus().then(setStatus);
    api.getAppVersion().then(setVersion);

    // Subscribe to status updates
    const unsubscribe = api.onUpdateStatus(setStatus);

    // Signal that renderer is ready (fixes race condition with launch check)
    api.signalRendererReady();

    return unsubscribe;
  }, []);

  const checkForUpdates = useCallback(() => {
    window.electronAPI?.checkForUpdates();
  }, []);

  const hasUpdate = status.state === 'available';

  return { status, version, checkForUpdates, hasUpdate };
}
