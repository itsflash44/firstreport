import { db } from '../db/client';
import type { CaseSession, LangCode, PersonaId, SeverityLevel } from '../types/index';
import { isValidLangCode } from '../types/i18n';
import { newId } from './id';

const V1_HISTORY_KEY = 'firstreport_history';
const MIGRATION_FLAG = 'fr_v2_migrated';

interface V1HistoryEntry {
  id?: string;
  ts: number;
  personaId: string;
  language: string;
  summary: string;
  severity: string;
  bnssSection?: string;
  transcript?: Array<{ role: 'ai' | 'user'; text: string }>;
}

const VALID_PERSONAS = new Set(['standard', 'pocso', 'women_dv', 'senior', 'advisor']);

function normalizeSeverity(raw: string): SeverityLevel {
  if (raw === 'low' || raw === 'medium' || raw === 'high' || raw === 'critical') return raw;
  return 'low';
}

function convertEntry(entry: V1HistoryEntry): CaseSession {
  const lang: LangCode = isValidLangCode(entry.language) ? entry.language : 'hi-IN';
  const persona: PersonaId = VALID_PERSONAS.has(entry.personaId)
    ? (entry.personaId as PersonaId)
    : 'standard';

  return {
    id: newId(),
    language: lang,
    personaId: persona,
    urgency: 1,
    status: 'sent',
    severity: normalizeSeverity(entry.severity),
    transcript: (entry.transcript ?? []).map((t, i) => ({
      id: `migrated_${i}`,
      role: t.role,
      text: t.text,
      timestamp: entry.ts + i * 1000,
    })),
    incidentSummary: entry.summary || '',
    classification: entry.bnssSection
      ? {
          bnss_section: entry.bnssSection,
          offense_name_hindi: '',
          offense_name_english: '',
          rationale_hindi: '',
          rationale_english: '',
          is_cognizable: false,
          punishment: '',
          confidence: 'medium',
        }
      : null,
    crimeInput: null,
    documents: [],
    syncStatus: 'synced',
    createdAt: entry.ts,
    updatedAt: entry.ts,
  };
}

export async function migrateV1History(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') return 0;

  let entries: V1HistoryEntry[] = [];
  try {
    const raw = localStorage.getItem(V1_HISTORY_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATION_FLAG, 'true');
      return 0;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(MIGRATION_FLAG, 'true');
      return 0;
    }
    entries = parsed;
  } catch {
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return 0;
  }

  const sessions = entries
    .filter((e) => e && typeof e.ts === 'number' && typeof e.summary === 'string')
    .map(convertEntry);

  if (sessions.length > 0) {
    await db.sessions.bulkPut(sessions);
  }

  localStorage.setItem(MIGRATION_FLAG, 'true');
  return sessions.length;
}

export function isMigrated(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(MIGRATION_FLAG) === 'true';
}
