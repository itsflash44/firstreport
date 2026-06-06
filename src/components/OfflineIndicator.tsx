'use client';

/**
 * FirstReport — Offline / Online Status Banner
 *
 * Listens to navigator.onLine and sync events.
 * Shows a reassuring banner when offline.
 * Animated sync indicator when syncing.
 */

import { useState, useEffect } from 'react';
import type { SyncEvent } from '@/lib/sync/syncEngine';

interface OfflineIndicatorProps {
  className?: string;
}

export default function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const [online, setOnline] = useState(true);
  const [syncState, setSyncState] = useState<SyncEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOnline(navigator.onLine);

    const handleOnline = () => {
      setOnline(true);
      // Show "back online" briefly then hide
      setTimeout(() => setVisible(false), 3000);
    };
    const handleOffline = () => {
      setOnline(false);
      setVisible(true);
    };
    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent<SyncEvent>).detail;
      setSyncState(detail);
      if (detail.state === 'syncing' || detail.state === 'offline') {
        setVisible(true);
      } else if (detail.state === 'success') {
        setTimeout(() => setVisible(false), 2000);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('firstReport:sync', handleSync);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('firstReport:sync', handleSync);
    };
  }, []);

  if (!mounted) return null;

  if (online && (!syncState || syncState.state === 'idle') && !visible) {
    return null;
  }

  const isOffline = !online;
  const isSyncing = syncState?.state === 'syncing';
  const hasPending = (syncState?.pending ?? 0) > 0;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${className}`}
      role="status"
      aria-live="polite"
    >
      {isOffline && (
        <div className="bg-amber-800 text-amber-50 px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
          <span className="font-medium">
            ऑफलाइन है — आपका काम सुरक्षित है, इंटरनेट आने पर सिंक होगा
          </span>
          {hasPending && (
            <span className="text-amber-300 text-xs">
              ({syncState?.pending} बाकी)
            </span>
          )}
        </div>
      )}

      {online && isSyncing && (
        <div className="bg-navy/90 text-white px-4 py-1.5 text-center text-xs flex items-center justify-center gap-2">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span>सिंक हो रहा है…</span>
        </div>
      )}

      {online && syncState?.state === 'success' && !isSyncing && visible && (
        <div className="bg-emerald-700 text-white px-4 py-1.5 text-center text-xs flex items-center justify-center gap-2">
          <span>✓</span>
          <span>सफलतापूर्वक सिंक हो गया</span>
        </div>
      )}

      {syncState?.state === 'error' && (
        <div className="bg-red-800 text-red-50 px-4 py-1.5 text-center text-xs flex items-center justify-center gap-2">
          <span>⚠</span>
          <span>सिंक में समस्या — दोबारा कोशिश होगी</span>
        </div>
      )}
    </div>
  );
}
