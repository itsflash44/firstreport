/**
 * FirstReport — History persistence
 *
 * Each completed advisory session is saved to localStorage so the user
 * can revisit prior advice and re-read the full conversation.
 * Offline-safe — no network round-trip.
 *
 * Storage key: `firstreport_history` (JSON array, capped at 50 entries).
 */

import type { LangCode, PersonaId } from './i18n';
import type { Severity } from './personas';

export interface ChatTurn {
  role: 'ai' | 'user';
  text: string;
}

export interface HistoryEntry {
  id: string;
  ts: number;                  // epoch ms
  personaId: PersonaId;
  language: LangCode;
  summary: string;             // incident summary (used as title)
  severity: Severity;
  bnssSection?: string;        // populated after classification, optional
  transcript?: ChatTurn[];     // full turn-by-turn conversation
}

const KEY         = 'firstreport_history';
const MAX_ENTRIES = 50;

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'h_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function logHistoryEntry(
  partial: Omit<HistoryEntry, 'id'> & { id?: string },
): HistoryEntry {
  if (typeof window === 'undefined') {
    return { id: uuid(), ...partial } as HistoryEntry;
  }
  const entry: HistoryEntry = { id: partial.id ?? uuid(), ...partial };
  try {
    const list = readHistory();
    const next = [entry, ...list].slice(0, MAX_ENTRIES);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* localStorage full or disabled */
  }
  return entry;
}

export function readHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function deleteHistoryEntry(id: string): void {
  if (typeof window === 'undefined') return;
  const list = readHistory().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
