/**
 * FirstReport — Citizen Legal Journey
 *
 * Persistent workspace model that tracks ALL legal activity across sessions.
 * Goes far beyond simple chat history — it's a full legal case management
 * system for non-technical citizens.
 *
 * Storage: localStorage (offline-first) + async sync to server
 * Key: `fr_legal_journey`
 * Max cases: 25 (older cases are archived, not deleted)
 */

import type { LangCode, PersonaId } from './i18n';

export type CaseStatus =
  | 'active'          // Ongoing, needs action
  | 'pending'         // Waiting for external response
  | 'escalated'       // Sent to SP/DM/Court
  | 'resolved'        // User marked resolved
  | 'archived';       // Auto-archived after 90 days of inactivity

export type DocumentType =
  | 'fir_complaint'
  | 'sp_complaint'
  | 'dm_petition'
  | 'hc_writ'
  | 'protection_order'
  | 'maintenance_demand'
  | 'tribunal_application'
  | 'childline_letter'
  | 'legal_notice'
  | 'affidavit'
  | 'evidence_list'
  | 'escalation_letter';

export type EvidenceType =
  | 'photo'
  | 'video'
  | 'audio'
  | 'document'
  | 'screenshot'
  | 'medical_report'
  | 'witness_statement';

export type ActionType =
  | 'document_generated'
  | 'document_sent'
  | 'complaint_filed'
  | 'escalation_sent'
  | 'evidence_uploaded'
  | 'conversation_held'
  | 'follow_up_scheduled'
  | 'note_added'
  | 'status_changed'
  | 'reminder_set';

export interface CaseDocument {
  id: string;
  type: DocumentType;
  title: string;
  generatedAt: number;     // epoch ms
  language: LangCode;
  pdfUrl?: string;         // local blob or server URL
  content?: string;        // markdown/text content
  sessionId?: string;      // server PDF session ID
  sentViaTelegram?: boolean;
  filedAt?: number;        // when it was actually filed
}

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  filename: string;
  uploadedAt: number;
  description?: string;
  verifiedByAI?: boolean;
  relevanceNote?: string;
}

export interface CaseAction {
  id: string;
  type: ActionType;
  ts: number;
  description: string;     // human-readable description
  language: LangCode;
  documentId?: string;     // linked document if applicable
  metadata?: Record<string, string | number | boolean>;
}

export interface AIRecommendation {
  id: string;
  ts: number;
  recommendation: string;
  statute?: string;
  priority: 'urgent' | 'important' | 'informational';
  dismissed?: boolean;
}

export interface ChatTurn {
  role: 'ai' | 'user';
  text: string;
  ts?: number;
  model?: 'gemma' | 'gemini' | 'mock' | 'none'; // which AI engine generated this
  actionType?: 'generate_docs'; // trigger specific frontend flows
}

export interface CaseConversation {
  id: string;
  ts: number;
  personaId: PersonaId;
  language: LangCode;
  summary: string;
  turns: ChatTurn[];
  bnssSection?: string;
  severity?: 'normal' | 'serious' | 'critical';
}

export interface FollowUpReminder {
  id: string;
  dueDate: number;         // epoch ms
  description: string;
  language: LangCode;
  completed?: boolean;
}

export interface LegalCase {
  id: string;
  userId?: string;
  createdAt: number;
  updatedAt: number;
  title: string;           // Auto-generated from first summary
  status: CaseStatus;
  personaId: PersonaId;
  language: LangCode;      // Primary language of the case
  severity: 'normal' | 'serious' | 'critical';

  // Incident details
  incidentSummary: string;
  victimName?: string;
  address?: string;
  location?: string;
  incidentDate?: number;
  policeStation?: string;
  officerName?: string;

  // Case progress
  bnssSection?: string;
  statutesCited: string[];
  documentsGenerated: CaseDocument[];
  evidence: EvidenceItem[];
  timeline: CaseAction[];
  conversations: CaseConversation[];
  aiRecommendations: AIRecommendation[];
  reminders: FollowUpReminder[];

  // Status tracking
  firRegistered?: boolean;
  escalationLevel?: 'police' | 'sp' | 'dm' | 'court' | 'nhrc';
  pendingSteps: string[];  // What needs to happen next
  userNotes?: string;

  // Linked data
  sessionIds: string[];    // Server session IDs for documents
}

const JOURNEY_KEY = 'fr_legal_journey';
const MAX_CASES   = 25;

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'lj_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function readJourney(): LegalCase[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LegalCase[]) : [];
  } catch {
    return [];
  }
}

function saveJourney(cases: LegalCase[]): void {
  if (typeof window === 'undefined') return;

  // Trim each case's conversation turns to prevent localStorage overflow.
  // Keep the last 60 turns per case — enough for full context restore without
  // blowing the 5MB limit on Android browsers (Sunita Devi constraint).
  const MAX_TURNS_PER_CASE = 60;
  const trimmed = cases.slice(0, MAX_CASES).map((c) => {
    if (!c.conversations || c.conversations.length === 0) return c;
    // Within each conversation, trim to max turns
    const convs = c.conversations.map((conv) => ({
      ...conv,
      turns: (conv.turns ?? []).slice(-MAX_TURNS_PER_CASE),
    }));
    // Keep at most 5 most recent conversations to manage size
    return { ...c, conversations: convs.slice(0, 5) };
  });

  try {
    localStorage.setItem(JOURNEY_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage quota exceeded — try saving only case metadata without turns
    try {
      const minimal = trimmed.map((c) => ({
        ...c,
        conversations: c.conversations.slice(0, 2).map((conv) => ({
          ...conv,
          turns: (conv.turns ?? []).slice(-20),
        })),
      }));
      localStorage.setItem(JOURNEY_KEY, JSON.stringify(minimal));
    } catch {
      console.error('[legalJourney] localStorage full — case data could not be saved');
    }
  }
}

export function createCase(partial: {
  title: string;
  personaId: PersonaId;
  language: LangCode;
  severity: 'normal' | 'serious' | 'critical';
  incidentSummary: string;
  bnssSection?: string;
  statutesCited?: string[];
}): LegalCase {
  const now = Date.now();
  const newCase: LegalCase = {
    id: uuid(),
    createdAt: now,
    updatedAt: now,
    status: 'active',
    documentsGenerated: [],
    evidence: [],
    timeline: [],
    conversations: [],
    aiRecommendations: [],
    reminders: [],
    pendingSteps: [],
    sessionIds: [],
    statutesCited: partial.statutesCited ?? [],
    ...partial,
  };

  const cases = readJourney();
  saveJourney([newCase, ...cases]);

  // Non-blocking sync
  syncCaseToServer(newCase).catch(() => {});

  return newCase;
}

export function updateCase(id: string, updates: Partial<LegalCase>): LegalCase | null {
  const cases = readJourney();
  const idx   = cases.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const updated = { ...cases[idx], ...updates, updatedAt: Date.now() };
  cases[idx] = updated;
  saveJourney(cases);
  return updated;
}

export function addConversationToCase(
  caseId: string,
  conversation: Omit<CaseConversation, 'id'>,
): void {
  const cases = readJourney();
  const idx   = cases.findIndex((c) => c.id === caseId);
  if (idx === -1) return;

  const existing = cases[idx].conversations ?? [];

  // Append turns to the most recent active conversation (same session) rather
  // than creating a new conversation object for every exchange.
  // A "session" is defined as within 30 minutes of the last conversation.
  const SESSION_GAP_MS = 30 * 60 * 1000;
  const now = Date.now();
  const lastConv = existing[0]; // conversations are prepended, so [0] is newest

  if (
    lastConv &&
    lastConv.personaId === conversation.personaId &&
    lastConv.language  === conversation.language &&
    now - lastConv.ts  < SESSION_GAP_MS
  ) {
    // Merge new turns into the existing active conversation
    lastConv.turns   = [...(lastConv.turns ?? []), ...(conversation.turns ?? [])];
    lastConv.summary = conversation.summary || lastConv.summary;
    if (conversation.severity) lastConv.severity = conversation.severity;
    cases[idx].conversations = [lastConv, ...existing.slice(1)];
  } else {
    // New session — create a fresh conversation record
    const conv: CaseConversation = { id: uuid(), ...conversation };
    cases[idx].conversations = [conv, ...existing];
  }

  cases[idx].updatedAt = now;
  saveJourney(cases);
}

export function addDocumentToCase(
  caseId: string,
  doc: Omit<CaseDocument, 'id'>,
): void {
  const cases = readJourney();
  const idx   = cases.findIndex((c) => c.id === caseId);
  if (idx === -1) return;

  const document: CaseDocument = { id: uuid(), ...doc };
  cases[idx].documentsGenerated = [...(cases[idx].documentsGenerated ?? []), document];
  cases[idx].updatedAt = Date.now();

  // Add a timeline action
  const action: CaseAction = {
    id: uuid(),
    type: 'document_generated',
    ts: Date.now(),
    description: `Document generated: ${doc.title}`,
    language: doc.language,
    documentId: document.id,
  };
  cases[idx].timeline = [action, ...(cases[idx].timeline ?? [])];

  saveJourney(cases);
}

export function addActionToCase(
  caseId: string,
  action: Omit<CaseAction, 'id'>,
): void {
  const cases = readJourney();
  const idx   = cases.findIndex((c) => c.id === caseId);
  if (idx === -1) return;

  const newAction: CaseAction = { id: uuid(), ...action };
  cases[idx].timeline = [newAction, ...(cases[idx].timeline ?? [])];
  cases[idx].updatedAt = Date.now();
  saveJourney(cases);
}

export function addRecommendationToCase(
  caseId: string,
  rec: Omit<AIRecommendation, 'id'>,
): void {
  const cases = readJourney();
  const idx   = cases.findIndex((c) => c.id === caseId);
  if (idx === -1) return;

  const recommendation: AIRecommendation = { id: uuid(), ...rec };
  cases[idx].aiRecommendations = [recommendation, ...(cases[idx].aiRecommendations ?? [])];
  cases[idx].updatedAt = Date.now();
  saveJourney(cases);
}

export function getLegalCase(id: string): LegalCase | null {
  const cases = readJourney();
  return cases.find((c) => c.id === id) ?? null;
}

export function getActiveCases(): LegalCase[] {
  return readJourney().filter((c) => c.status === 'active' || c.status === 'pending' || c.status === 'escalated');
}

export function deleteLegalCase(id: string): void {
  const cases = readJourney().filter((c) => c.id !== id);
  saveJourney(cases);
}

export function archiveOldCases(): void {
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const cases = readJourney().map((c) => {
    if (c.status === 'active' && now - c.updatedAt > NINETY_DAYS) {
      return { ...c, status: 'archived' as CaseStatus };
    }
    return c;
  });
  saveJourney(cases);
}

/**
 * Convert a legacy HistoryEntry to a LegalCase.
 * Called during migration so old data isn't lost.
 */
export function migrateHistoryEntry(entry: {
  id: string;
  ts: number;
  personaId: PersonaId;
  language: LangCode;
  summary: string;
  severity: 'normal' | 'serious' | 'critical';
  bnssSection?: string;
  transcript?: ChatTurn[];
  sessionId?: string;
}): LegalCase {
  const conv: CaseConversation = {
    id: uuid(),
    ts: entry.ts,
    personaId: entry.personaId,
    language: entry.language,
    summary: entry.summary,
    turns: entry.transcript ?? [],
    bnssSection: entry.bnssSection,
    severity: entry.severity,
  };

  return {
    id: entry.id,
    createdAt: entry.ts,
    updatedAt: entry.ts,
    title: entry.summary.slice(0, 80),
    status: 'active',
    personaId: entry.personaId,
    language: entry.language,
    severity: entry.severity,
    incidentSummary: entry.summary,
    bnssSection: entry.bnssSection,
    statutesCited: entry.bnssSection ? [`BNSS § ${entry.bnssSection}`] : [],
    documentsGenerated: [],
    evidence: [],
    timeline: [],
    conversations: [conv],
    aiRecommendations: [],
    reminders: [],
    pendingSteps: [],
    sessionIds: entry.sessionId ? [entry.sessionId] : [],
  };
}

async function syncCaseToServer(legalCase: LegalCase): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/legal-journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(legalCase),
    });
  } catch {
    /* best-effort — localStorage is ground truth */
  }
}
