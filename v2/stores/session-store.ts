import { create } from 'zustand';
import type {
  CaseSession,
  ChatTurn,
  Classification,
  CrimeInput,
  GeneratedDocument,
  LangCode,
  PersonaId,
  SessionStatus,
  SeverityLevel,
  Urgency,
} from '../types/index';
import { putSession, getActiveSession } from '../db/session-repo';
import { newId } from '../utils/id';

interface SessionState {
  activeSession: CaseSession | null;

  createSession: (lang: LangCode, persona: PersonaId, urgency: Urgency) => CaseSession;
  loadActiveSession: () => Promise<void>;
  setActiveSession: (session: CaseSession | null) => void;

  addTurn: (turn: Omit<ChatTurn, 'id' | 'timestamp'>) => void;
  setSeverity: (level: SeverityLevel) => void;
  setIncidentSummary: (summary: string) => void;
  setClassification: (classification: Classification) => void;
  setCrimeInput: (input: CrimeInput) => void;
  setDocuments: (docs: GeneratedDocument[]) => void;
  advanceStatus: (status: SessionStatus) => void;
  clearSession: () => void;
}

function persist(session: CaseSession): void {
  putSession(session).catch(() => {
    // IndexedDB write failed — session is still in memory.
    // Retry will happen on next mutation or hydration.
  });
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  activeSession: null,

  createSession: (lang, persona, urgency) => {
    const session: CaseSession = {
      id: newId(),
      language: lang,
      personaId: persona,
      urgency,
      status: 'draft',
      severity: 'low',
      transcript: [],
      incidentSummary: '',
      classification: null,
      crimeInput: null,
      documents: [],
      syncStatus: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set({ activeSession: session });
    persist(session);
    return session;
  },

  loadActiveSession: async () => {
    const session = await getActiveSession();
    if (session) {
      set({ activeSession: session });
    }
  },

  setActiveSession: (session) => {
    set({ activeSession: session });
    if (session) persist(session);
  },

  addTurn: (turn) => {
    const current = get().activeSession;
    if (!current) return;

    const fullTurn: ChatTurn = {
      ...turn,
      id: newId(),
      timestamp: Date.now(),
    };

    const updated: CaseSession = {
      ...current,
      transcript: [...current.transcript, fullTurn],
      status: current.status === 'draft' ? 'interviewing' : current.status,
      updatedAt: Date.now(),
    };
    set({ activeSession: updated });
    persist(updated);
  },

  setSeverity: (level) => {
    const current = get().activeSession;
    if (!current) return;
    const updated = { ...current, severity: level, updatedAt: Date.now() };
    set({ activeSession: updated });
    persist(updated);
  },

  setIncidentSummary: (summary) => {
    const current = get().activeSession;
    if (!current) return;
    const updated = { ...current, incidentSummary: summary, updatedAt: Date.now() };
    set({ activeSession: updated });
    persist(updated);
  },

  setClassification: (classification) => {
    const current = get().activeSession;
    if (!current) return;
    const updated = {
      ...current,
      classification,
      status: 'classified' as SessionStatus,
      updatedAt: Date.now(),
    };
    set({ activeSession: updated });
    persist(updated);
  },

  setCrimeInput: (input) => {
    const current = get().activeSession;
    if (!current) return;
    const updated = { ...current, crimeInput: input, updatedAt: Date.now() };
    set({ activeSession: updated });
    persist(updated);
  },

  setDocuments: (docs) => {
    const current = get().activeSession;
    if (!current) return;
    const updated = {
      ...current,
      documents: docs,
      status: 'documents_ready' as SessionStatus,
      updatedAt: Date.now(),
    };
    set({ activeSession: updated });
    persist(updated);
  },

  advanceStatus: (status) => {
    const current = get().activeSession;
    if (!current) return;
    const updated = { ...current, status, updatedAt: Date.now() };
    set({ activeSession: updated });
    persist(updated);
  },

  clearSession: () => {
    set({ activeSession: null });
  },
}));
