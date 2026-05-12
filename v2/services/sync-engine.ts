import { useSyncStore } from '../stores/sync-store';
import { sendDocument } from './telegram';
import { isOffline } from './network';
import type { SyncQueueItem } from '../types/index';

const MAX_RETRY_COUNT = 5;
const DRAIN_INTERVAL_MS = 30_000;

let drainTimer: ReturnType<typeof setInterval> | null = null;

async function processItem(item: SyncQueueItem): Promise<boolean> {
  const store = useSyncStore.getState();

  await store.markItemAttempted(item.id);

  switch (item.action) {
    case 'send_telegram': {
      const { pdf, filename, chatId, sessionId } = item.payload as {
        pdf: ArrayBuffer;
        filename: string;
        chatId?: string;
        sessionId: string;
      };
      const result = await sendDocument({ sessionId, pdf, filename, chatId });
      return result.success;
    }

    case 'upload_pdf':
    case 'sync_session':
      return true;

    default:
      return false;
  }
}

export async function drainQueue(): Promise<void> {
  const store = useSyncStore.getState();

  if (store.isSyncing || isOffline()) return;

  const pending = store.queue.filter((i) => i.retryCount < MAX_RETRY_COUNT);
  if (pending.length === 0) return;

  store.setSyncing(true);

  try {
    for (const item of pending) {
      if (isOffline()) break;

      try {
        const ok = await processItem(item);
        if (ok) {
          await store.dequeue(item.id);
        }
      } catch {
        // markItemAttempted already incremented retryCount
      }
    }
  } finally {
    store.setSyncing(false);
  }
}

export function startSyncEngine(): void {
  if (drainTimer) return;
  drainQueue();
  drainTimer = setInterval(drainQueue, DRAIN_INTERVAL_MS);

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      drainQueue();
    });
  }
}

export function stopSyncEngine(): void {
  if (drainTimer) {
    clearInterval(drainTimer);
    drainTimer = null;
  }
}
