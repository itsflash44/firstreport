import Dexie, { type EntityTable } from 'dexie';
import type { CaseSession, SyncQueueItem } from '../types/index';

export interface TtsCacheEntry {
  hash: string;
  audio: ArrayBuffer;
  createdAt: number;
}

class FirstReportDB extends Dexie {
  sessions!: EntityTable<CaseSession, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  ttsCache!: EntityTable<TtsCacheEntry, 'hash'>;

  constructor() {
    super('firstreport_v2');

    this.version(1).stores({
      sessions: 'id, status, createdAt, updatedAt',
      syncQueue: 'id, sessionId, createdAt',
      ttsCache: 'hash',
    });
  }
}

export const db = new FirstReportDB();
