import { create } from 'zustand';
import type { SyncQueueItem } from '../types/index';
import {
  enqueue as dbEnqueue,
  dequeue as dbDequeue,
  getPending,
  markAttempted,
} from '../db/sync-queue-repo';
import { newId } from '../utils/id';

interface SyncState {
  queue: SyncQueueItem[];
  isSyncing: boolean;

  loadQueue: () => Promise<void>;
  enqueue: (item: Omit<SyncQueueItem, 'id' | 'retryCount' | 'lastAttempt' | 'createdAt'>) => Promise<SyncQueueItem>;
  dequeue: (id: string) => Promise<void>;
  markItemAttempted: (id: string) => Promise<void>;
  setSyncing: (syncing: boolean) => void;
}

export const useSyncStore = create<SyncState>()((set, get) => ({
  queue: [],
  isSyncing: false,

  loadQueue: async () => {
    const items = await getPending();
    set({ queue: items });
  },

  enqueue: async (partial) => {
    const item: SyncQueueItem = {
      ...partial,
      id: newId(),
      retryCount: 0,
      lastAttempt: null,
      createdAt: Date.now(),
    };
    await dbEnqueue(item);
    set((state) => ({ queue: [...state.queue, item] }));
    return item;
  },

  dequeue: async (id) => {
    await dbDequeue(id);
    set((state) => ({ queue: state.queue.filter((i) => i.id !== id) }));
  },

  markItemAttempted: async (id) => {
    await markAttempted(id);
    set((state) => ({
      queue: state.queue.map((i) =>
        i.id === id
          ? { ...i, retryCount: i.retryCount + 1, lastAttempt: Date.now() }
          : i
      ),
    }));
  },

  setSyncing: (syncing) => set({ isSyncing: syncing }),
}));
