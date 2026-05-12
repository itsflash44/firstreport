import { db } from './client';
import type { SyncQueueItem } from '../types/index';

export async function enqueue(item: SyncQueueItem): Promise<void> {
  await db.syncQueue.put(item);
}

export async function dequeue(id: string): Promise<void> {
  await db.syncQueue.delete(id);
}

export async function getPending(): Promise<SyncQueueItem[]> {
  return db.syncQueue.orderBy('createdAt').toArray();
}

export async function markAttempted(id: string): Promise<void> {
  await db.syncQueue.update(id, {
    retryCount: (await db.syncQueue.get(id))?.retryCount ?? 0 + 1,
    lastAttempt: Date.now(),
  } as Partial<SyncQueueItem>);
}

export async function getBySession(sessionId: string): Promise<SyncQueueItem[]> {
  return db.syncQueue.where('sessionId').equals(sessionId).toArray();
}

export async function clearCompleted(): Promise<number> {
  return db.syncQueue.where('retryCount').above(4).delete();
}
