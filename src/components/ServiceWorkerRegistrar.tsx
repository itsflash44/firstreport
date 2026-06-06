'use client';

/**
 * FirstReport — Service Worker Registration (v2)
 *
 * Improvements over v1:
 * - Handles `waiting` state: new SW activates without user interaction
 *   (calls postMessage SKIP_WAITING so the waiting SW takes control)
 * - Re-registers Background Sync tag on every `online` event so queued
 *   operations flush immediately when Jio 4G reconnects
 * - Dispatches firstReport:syncTrigger on SW controllerchange so the
 *   sync engine runs the moment a new SW takes control
 * - SW update check interval reduced to 5 min (was 30) for faster rollouts
 */

import { useEffect } from 'react';

type ExtendedSWRegistration = ServiceWorkerRegistration & {
  sync?: { register: (tag: string) => Promise<void> };
};

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let registration: ExtendedSWRegistration | null = null;

    // ── Background Sync: re-register tag on reconnect ──────────────────────
    // This ensures the SW fires the 'sync' event as soon as Jio 4G comes back,
    // flushing the offline queue without waiting for the next 30-second cycle.
    const handleOnline = async () => {
      if (!registration?.sync) return;
      try {
        await registration.sync.register('firstReport-sync');
      } catch { /* Background sync not available — periodic timer is fallback */ }
    };

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',   // Always fetch sw.js fresh (never use HTTP cache)
        }) as ExtendedSWRegistration;

        // ── Handle SW waiting — skip the wait, take control immediately ────
        // Our SW calls self.skipWaiting() in install, but if multiple tabs are
        // open the new SW may still sit in 'waiting'. Posting SKIP_WAITING is
        // belt-and-suspenders. Safe to call even if already active.
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW installed and waiting — activate immediately
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // ── Update check every 5 minutes (fast rollout for hackathon) ─────
        const updateInterval = setInterval(() => {
          registration?.update().catch(() => {});
        }, 5 * 60 * 1000);

        // ── Controller change: new SW activated ────────────────────────────
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Trigger sync so any offline data queued during the update is flushed
          window.dispatchEvent(new CustomEvent('firstReport:swReady'));
          window.dispatchEvent(new CustomEvent('firstReport:syncTrigger'));
        });

        // ── SW messages: background sync trigger ──────────────────────────
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'BACKGROUND_SYNC_TRIGGER') {
            window.dispatchEvent(new CustomEvent('firstReport:syncTrigger'));
          }
        });

        // ── Background Sync: initial registration ─────────────────────────
        if (registration.sync) {
          try {
            await registration.sync.register('firstReport-sync');
          } catch { /* Not available — periodic timer handles this */ }
        }

        window.addEventListener('online', handleOnline);

        // Cleanup
        return () => {
          clearInterval(updateInterval);
          window.removeEventListener('online', handleOnline);
        };

      } catch (error) {
        // SW registration failed — app still works, just no offline caching
        console.warn('[SW] Registration failed:', error);
      }
    };

    const cleanup = register();

    return () => {
      // If register() returned a cleanup fn, call it
      cleanup?.then?.((fn) => fn?.());
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}
