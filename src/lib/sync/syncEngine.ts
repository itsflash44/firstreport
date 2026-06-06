/**
 * FirstReport — Offline Sync Engine (Production-Hardened)
 *
 * Fixes applied vs v1:
 * - _syncRunning wrapped in try/finally → never permanently deadlocks
 * - Dexie query uses numeric sentinel (0) instead of undefined cast
 * - verifyConnectivity uses X-SW-Bypass header → SW never caches ping
 * - startAutoSync is globally deduped (module-level guard)
 * - Document upload with actual Supabase storage
 * - Explicit error logging with context
 */

import {
  getDB,
  addToSyncQueue,
  type SyncQueueItem,
  type SyncStatus,
} from '@/lib/db/dexie';

// ─────────────────────────────────────────────────────────────────────────────
// SYNC STATE EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error' | 'success';

export interface SyncEvent {
  state: SyncState;
  pending: number;
  lastSync?: number;
  error?: string;
}

function emitSyncEvent(event: SyncEvent): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('firstReport:sync', { detail: event }));
}

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTIVITY — bypasses SW cache with X-SW-Bypass header
// ─────────────────────────────────────────────────────────────────────────────

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : false;
}

export async function verifyConnectivity(): Promise<boolean> {
  if (!isOnline()) return false;
  try {
    // X-SW-Bypass tells our SW to skip cache (see sw.js NEVER_CACHE check)
    const response = await fetch(`/api/ping?t=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
      headers: { 'X-SW-Bypass': 'true' },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKOFF
// ─────────────────────────────────────────────────────────────────────────────

// Sentinel value for "no delay scheduled" — items with nextAttempt=0 run immediately
const IMMEDIATE = 0;

function computeNextAttempt(retryCount: number): number {
  const base = 30_000;
  const max = 30 * 60 * 1000;
  const delay = Math.min(base * Math.pow(2, retryCount), max);
  const jitter = Math.random() * 5000;
  return Date.now() + delay + jitter;
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC OPERATION — POST to /api/sync
// ─────────────────────────────────────────────────────────────────────────────

async function syncOperation(item: SyncQueueItem): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SW-Bypass': 'true',
      },
      body: JSON.stringify({
        operation: item.operationType,
        entityId: item.entityId,
        entityType: item.entityType,
        payload: item.payload,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => 'Unknown error');
      return { success: false, error: `HTTP ${response.status}: ${err}` };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK ENTITY AS SYNCED
// ─────────────────────────────────────────────────────────────────────────────

async function markEntitySynced(
  entityType: SyncQueueItem['entityType'],
  entityId: string,
  status: SyncStatus = 'synced',
): Promise<void> {
  const db = getDB();
  try {
    switch (entityType) {
      case 'case':      await db.cases.update(entityId, { syncStatus: status }); break;
      case 'message':   await db.messages.update(entityId, { syncStatus: status }); break;
      case 'document':  await db.documents.update(entityId, { syncStatus: status }); break;
      case 'timeline':  await db.timelineEvents.update(entityId, { syncStatus: status }); break;
      case 'readiness': await db.readinessState.update(entityId, { syncStatus: status }); break;
    }
  } catch (e) {
    // Non-fatal — entity may have been deleted
    console.warn('[Sync] markEntitySynced failed:', entityType, entityId, e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SYNC CYCLE — hardened with try/finally
// ─────────────────────────────────────────────────────────────────────────────

let _syncRunning = false;
let _lastSuccessfulSync: number | undefined;

export async function runSyncCycle(): Promise<void> {
  if (_syncRunning) return;
  if (!(await verifyConnectivity())) {
    emitSyncEvent({ state: 'offline', pending: await getPendingCount() });
    return;
  }

  _syncRunning = true;

  try {
    const db = getDB();
    const now = Date.now();

    // FIX: use numeric sentinel (0 = immediate) instead of undefined cast
    // Items with no nextAttempt set default to 0 at creation time
    const pendingItems = await db.syncQueue
      .where('nextAttempt')
      .belowOrEqual(now)
      .sortBy('priority');

    if (pendingItems.length === 0) {
      emitSyncEvent({ state: 'idle', pending: 0, lastSync: _lastSuccessfulSync });
      return;
    }

    emitSyncEvent({ state: 'syncing', pending: pendingItems.length });

    let successCount = 0;
    let failCount = 0;

    for (const item of pendingItems) {
      if (item.retryCount >= item.maxRetries) {
        await db.syncQueue.delete(item.id!);
        await markEntitySynced(item.entityType, item.entityId, 'failed');
        failCount++;
        continue;
      }

      const result = await syncOperation(item);

      if (result.success) {
        await db.syncQueue.delete(item.id!);
        await markEntitySynced(item.entityType, item.entityId, 'synced');
        successCount++;
      } else {
        await db.syncQueue.update(item.id!, {
          retryCount: item.retryCount + 1,
          lastAttempt: now,
          nextAttempt: computeNextAttempt(item.retryCount + 1),
          error: result.error,
        });
        failCount++;
      }
    }

    _lastSuccessfulSync = Date.now();
    const remaining = await getPendingCount();
    emitSyncEvent({
      state: failCount > 0 && successCount === 0 ? 'error' : 'success',
      pending: remaining,
      lastSync: _lastSuccessfulSync,
    });

  } catch (err) {
    // FIX: was missing — any Dexie error left _syncRunning=true forever
    console.error('[Sync] runSyncCycle failed:', err);
    emitSyncEvent({ state: 'error', pending: await getPendingCount().catch(() => 0) });
  } finally {
    // FIX: unconditionally reset — was missing try/finally
    _syncRunning = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PENDING COUNT
// ─────────────────────────────────────────────────────────────────────────────

export async function getPendingCount(): Promise<number> {
  try {
    const db = getDB();
    return await db.syncQueue.count();
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-SYNC — globally deduped, prevents interval stacking
// ─────────────────────────────────────────────────────────────────────────────

let _syncInterval: ReturnType<typeof setInterval> | null = null;
let _syncStarted = false;

export function startAutoSync(intervalMs = 30_000): () => void {
  if (typeof window === 'undefined') return () => {};

  // FIX: prevent multiple intervals from stacking (multi-tab or HMR)
  if (_syncStarted && _syncInterval) {
    return () => {
      if (_syncInterval) {
        clearInterval(_syncInterval);
        _syncInterval = null;
        _syncStarted = false;
      }
    };
  }

  _syncStarted = true;

  // Initial sync
  runSyncCycle().catch(console.error);

  // Clear any previous interval before setting new one
  if (_syncInterval) clearInterval(_syncInterval);

  _syncInterval = setInterval(() => {
    runSyncCycle().catch(console.error);
  }, intervalMs);

  const onOnline = () => { runSyncCycle().catch(console.error); };
  const onSWTrigger = () => { runSyncCycle().catch(console.error); };

  window.addEventListener('online', onOnline);
  window.addEventListener('firstReport:syncTrigger', onSWTrigger);

  return () => {
    if (_syncInterval) {
      clearInterval(_syncInterval);
      _syncInterval = null;
    }
    _syncStarted = false;
    window.removeEventListener('online', onOnline);
    window.removeEventListener('firstReport:syncTrigger', onSWTrigger);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD TO SYNC QUEUE — with dedup check
// ─────────────────────────────────────────────────────────────────────────────

export async function safeAddToSyncQueue(
  operationType: SyncQueueItem['operationType'],
  entityId: string,
  entityType: SyncQueueItem['entityType'],
  payload: Record<string, unknown>,
  priority: 1 | 2 | 3 = 2,
): Promise<void> {
  try {
    const db = getDB();
    // FIX: prevent duplicate queue entries for same entity + operation
    const existing = await db.syncQueue
      .where('entityId').equals(entityId)
      .and(item => item.operationType === operationType)
      .first();

    if (existing) {
      // Update payload, reset retry count
      await db.syncQueue.update(existing.id!, {
        payload,
        retryCount: 0,
        nextAttempt: IMMEDIATE,
        error: undefined,
      });
      return;
    }

    await db.syncQueue.add({
      operationType,
      entityId,
      entityType,
      payload,
      retryCount: 0,
      maxRetries: 5,
      nextAttempt: IMMEDIATE,   // FIX: use 0 not undefined
      createdAt: Date.now(),
      priority,
    });
  } catch (e) {
    console.error('[Sync] safeAddToSyncQueue failed:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT UPLOAD — with Supabase storage + fallback
// ─────────────────────────────────────────────────────────────────────────────

export async function queueDocumentUpload(
  documentId: string,
  caseId: string,
  file: Blob,
  fileName: string,
  mimeType: string,
): Promise<void> {
  const db = getDB();

  // Always store blob locally first — this is the offline guarantee
  await db.documents.update(documentId, {
    localBlob: file,
    syncStatus: 'local',
    uploadProgress: 0,
  }).catch(console.error);

  // Queue for sync
  await safeAddToSyncQueue(
    'UPLOAD_DOCUMENT',
    documentId,
    'document',
    { caseId, fileName, mimeType, fileSize: file.size },
    1, // highest priority
  );

  // Attempt immediate upload if online
  if (await verifyConnectivity()) {
    uploadDocumentNow(documentId, caseId, file, fileName, mimeType).catch(console.error);
  }
}

async function uploadDocumentNow(
  documentId: string,
  caseId: string,
  file: Blob,
  fileName: string,
  mimeType: string,
): Promise<void> {
  const db = getDB();

  try {
    await db.documents.update(documentId, { syncStatus: 'syncing', uploadProgress: 10 });

    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('documentId', documentId);
    formData.append('caseId', caseId);
    formData.append('mimeType', mimeType);

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
      headers: { 'X-SW-Bypass': 'true' },
    });

    if (!response.ok) {
      throw new Error(`Upload HTTP ${response.status}: ${await response.text().catch(() => '')}`);
    }

    const data = await response.json() as { url?: string; error?: string };

    if (data.url) {
      await db.documents.update(documentId, {
        uploadedUrl: data.url,
        syncStatus: 'synced',
        uploadProgress: 100,
      });

      // Remove from sync queue since upload succeeded
      const queueItems = await db.syncQueue.where('entityId').equals(documentId).toArray();
      for (const item of queueItems) {
        if (item.operationType === 'UPLOAD_DOCUMENT') {
          await db.syncQueue.delete(item.id!);
        }
      }
    } else {
      throw new Error(data.error ?? 'No URL in upload response');
    }

  } catch (err) {
    console.error('[Sync] uploadDocumentNow failed:', documentId, err);
    await db.documents.update(documentId, {
      syncStatus: 'local', // not 'failed' — we'll retry via queue
      uploadProgress: 0,
    }).catch(() => {});
  }
}
