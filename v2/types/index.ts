export type LangCode =
  | 'hi-IN' | 'en-IN' | 'bn-IN' | 'ta-IN' | 'te-IN'
  | 'mr-IN' | 'gu-IN' | 'kn-IN' | 'ml-IN' | 'pa-IN' | 'od-IN';

export type PersonaId = 'standard' | 'pocso' | 'women_dv' | 'senior' | 'advisor';

export type Urgency = 1 | 2 | 3;

export type SessionStatus = 'draft' | 'interviewing' | 'classified' | 'documents_ready' | 'sent' | 'failed';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type LetterType = 'SP' | 'DM' | 'HC' | 'OFFICER';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface LanguageConfig {
  code: LangCode;
  sarvamCode: string;
  bcp47: string;
  label: string;
  sublabel: string;
  shape: 'circle' | 'square' | 'triangle';
  color: 'red' | 'blue' | 'yellow';
}

export interface ChatTurn {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: number;
  audioUrl?: string;
}

export interface Classification {
  bnss_section: string;
  offense_name_hindi: string;
  offense_name_english: string;
  rationale_hindi: string;
  rationale_english: string;
  is_cognizable: boolean;
  punishment: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CrimeInput {
  victim_name: string;
  victim_address: string;
  incident_date: string;
  incident_location: string;
  accused_name: string;
  accused_description: string;
  witnesses: string;
  evidence: string;
}

export interface GeneratedDocument {
  letterType: LetterType;
  title: string;
  subtitle: string;
  unlockDays: number;
  status: 'ready' | 'locked' | 'generating' | 'failed';
  pdfPath?: string;
  generatedAt?: number;
}

export interface CaseSession {
  id: string;
  language: LangCode;
  personaId: PersonaId;
  urgency: Urgency;
  status: SessionStatus;
  severity: SeverityLevel;
  transcript: ChatTurn[];
  incidentSummary: string;
  classification: Classification | null;
  crimeInput: CrimeInput | null;
  documents: GeneratedDocument[];
  syncStatus: SyncStatus;
  createdAt: number;
  updatedAt: number;
}

export interface SyncQueueItem {
  id: string;
  sessionId: string;
  action: 'send_telegram' | 'upload_pdf' | 'sync_session';
  payload: Record<string, unknown>;
  retryCount: number;
  lastAttempt: number | null;
  createdAt: number;
}

export interface AppSettings {
  language: LangCode;
  darkMode: boolean;
  autoPlayTts: boolean;
  offlineMode: boolean;
}
