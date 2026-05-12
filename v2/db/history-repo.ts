import { db } from './client';
import type { CaseSession } from '../types/index';

export async function getHistory(): Promise<CaseSession[]> {
  return db.sessions
    .where('status')
    .anyOf('sent', 'documents_ready', 'classified')
    .reverse()
    .sortBy('createdAt');
}

export async function getHistoryEntry(id: string): Promise<CaseSession | undefined> {
  return db.sessions.get(id);
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await db.sessions.delete(id);
}

export async function clearHistory(): Promise<void> {
  const entries = await getHistory();
  const ids = entries.map((e) => e.id);
  await db.sessions.bulkDelete(ids);
}
