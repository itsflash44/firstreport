'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/app-store';
import { useSessionStore } from '../stores/session-store';
import { useSyncStore } from '../stores/sync-store';
import { migrateV1History } from '../utils/migration';

export function useHydration(): boolean {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const setHydrated = useAppStore((s) => s.setHydrated);
  const setOnline = useAppStore((s) => s.setOnline);
  const loadActiveSession = useSessionStore((s) => s.loadActiveSession);
  const loadQueue = useSyncStore((s) => s.loadQueue);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    async function hydrate() {
      try {
        await migrateV1History();
        await loadActiveSession();
        await loadQueue();
      } catch {
        // IndexedDB unavailable (private browsing, storage full).
        // App works with empty state — no crash.
      }

      setHydrated(true);
    }

    hydrate();

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setHydrated, setOnline, loadActiveSession, loadQueue]);

  return isHydrated;
}
