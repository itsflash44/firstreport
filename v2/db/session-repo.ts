import { db } from './client';
import type { CaseSession, SessionStatus } from '../types/index';

const TERMINAL_STATUSES: SessionStatus[] = ['sent', 'failed'];

export async function putSession(session: CaseSession): Promise<void> {
  await db.sessions.put(session);
}

export async function getSession(id: string): Promise<CaseSession | undefined> {
  return db.sessions.get(id);
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id);
}

export async function getActiveSession(): Promise<CaseSession | undefined> {
  const all = await db.sessions
    .orderBy('updatedAt')
    .reverse()
    .toArray();

  return all.find((s) => !TERMINAL_STATUSES.includes(s.status));
}

export async function listSessions(): Promise<CaseSession[]> {
  return db.sessions.orderBy('createdAt').reverse().toArray();
}

export async function listCompletedSessions(): Promise<CaseSession[]> {
  return db.sessions
    .where('status')
    .equals('sent')
    .reverse()
    .sortBy('createdAt');
}
