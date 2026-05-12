'use client';

import { useEffect, useState } from 'react';
import { drainQueue } from '../services/sync-engine';

export interface UseSwReturn {
  isSupported: boolean;
  isReady: boolean;
  hasUpdate: boolean;
  applyUpdate: () => void;
}

export function useSwRegistration(): UseSwReturn {
  const [isReady, setIsReady] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setRegistration(reg);
        setIsReady(true);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setHasUpdate(true);
            }
          });
        });
      })
      .catch(() => {
        // SW registration failed — app works without it
      });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_TRIGGER') {
        drainQueue();
      }
    });
  }, []);

  const applyUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator,
    isReady,
    hasUpdate,
    applyUpdate,
  };
}
