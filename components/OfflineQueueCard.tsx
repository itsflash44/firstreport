'use client';

import { useState, useEffect, useCallback } from 'react';

interface QueueStatus {
  pending: number;
  statusHindi: string;
  showCard: boolean;
}

/**
 * OfflineQueueCard — shows a non-blocking status card when Telegram
 * documents are queued for retry (offline or failed delivery).
 * Polls /api/queue/status every 30 seconds.
 * Uses TTS to announce queue status on first appearance.
 */
export default function OfflineQueueCard() {
  const [status, setStatus] = useState<QueueStatus>({ pending: 0, statusHindi: '', showCard: false });
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [announced, setAnnounced] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/queue/status');
      const data: QueueStatus = await res.json();
      setStatus(data);

      // Auto-announce via TTS on first appearance
      if (data.showCard && !announced && data.statusHindi) {
        setAnnounced(true);
        try {
          await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.statusHindi, language: 'hi-IN' }),
          });
        } catch { /* TTS is best-effort */ }
      }
    } catch { /* network may be down — silent */ }
  }, [announced]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await fetch('/api/queue/retry', { method: 'POST' });
      await fetchStatus();
    } catch { /* best-effort */ }
    setRetrying(false);
  };

  if (!status.showCard || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96"
    >
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-lg shadow-lg">
        {/* Pulsing dot */}
        <span className="mt-1 w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            {status.pending} दस्तावेज़ भेजने बाकी
          </p>
          <p className="text-xs text-amber-700 mt-0.5 leading-snug">
            नेटवर्क आने पर अपने आप भेजे जाएंगे
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="text-xs font-semibold text-amber-800 border border-amber-400 rounded px-2 py-1
                       hover:bg-amber-100 disabled:opacity-40 transition-colors"
          >
            {retrying ? '...' : 'अभी भेजें'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="text-amber-500 hover:text-amber-700 text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
