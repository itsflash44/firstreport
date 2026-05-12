/**
 * FirstReport — Offline-First Legal Database (Dexie.js / IndexedDB)
 *
 * This module is the backbone of offline persistence. All data created
 * while offline is stored here and synced when connectivity returns.
 *
 * Designed for: Kaggle Gemma Hackathon · Billion-dollar citizen-AI vision
 */

import Dexie, { type EntityTable } from 'dexie';

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'conflict' | 'failed';
export type VerificationStatus =
  | 'Verified'
  | 'Needs Better Scan'
  | 'Partial Match'
  | 'Name Mismatch'
  | 'Low Quality'
  | 'Incomplete Document'
  | 'Pending Review'
  | 'In Review';

export type DocumentType =
  | 'Aadhaar Card'
  | 'PAN Card'
  | 'Passport'
  | 'Driving License'
  | 'FIR Copy'
  | 'Medical Certificate'
  | 'Affidavit'
  | 'Bank Statement'
  | 'Utility Bill'
  | 'Other';

export type SyncOperationType =
  | 'CREATE_CASE'
  | 'UPDATE_CASE'
  | 'CREATE_MESSAGE'
  | 'UPLOAD_DOCUMENT'
  | 'UPDATE_VERIFICATION'
  | 'ADD_TIMELINE_EVENT'
  | 'UPDATE_READINESS';

// ─────────────────────────────────────────────────────────────────────────────
// TABLE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export interface LocalCase {
  id: string;                    // UUID — generated client-side
  remoteId?: string;             // Server-side ID after sync
  title: string;
  language: string;
  status: 'active' | 'resolved' | 'archived';
  specialistMode?: string;
  aiSummary?: string;
  urgency?: 1 | 2 | 3;
  complainantName?: string;
  complainantPhone?: string;
  incidentDescription?: string;
  legalCategory?: string;        // BNSS section classification
  readinessScore?: number;       // 0–100
  createdAt: number;             // Unix timestamp ms
  updatedAt: number;
  syncStatus: SyncStatus;
  localVersion: number;          // For conflict detection
}

export interface LocalMessage {
  id: string;
  caseId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  audioUrl?: string;             // Local blob URL for TTS
  isVoiceInput?: boolean;
  aiModel?: 'gemma-local' | 'gemini-cloud' | 'gemma-kaggle';
  createdAt: number;
  syncStatus: SyncStatus;
}

export interface LocalDocument {
  id: string;
  caseId: string;
  type: DocumentType;
  fileName: string;
  mimeType: string;
  localBlob?: Blob;              // Actual file stored locally
  localBlobUrl?: string;         // Object URL (ephemeral)
  uploadedUrl?: string;          // Cloud URL after sync
  verificationStatus: VerificationStatus;
  ocrData?: OCRResult;
  qualityScore?: number;         // 0–100
  verificationScore?: number;    // 0–100
  createdAt: number;
  syncStatus: SyncStatus;
  uploadProgress?: number;       // 0–100
}

export interface OCRResult {
  rawText: string;
  confidence: number;            // 0–100 Tesseract confidence
  language: string;
  processingTime: number;        // ms
  qualityAnalysis: ImageQuality;
  extractedFields: ExtractedFields;
  verificationResult: VerificationResult;
  processedAt: number;
  ocrEngine: 'tesseract-browser' | 'cloud-vision' | 'gemma-vision';
}

export interface ImageQuality {
  overallScore: number;          // 0–100
  isBlurry: boolean;
  blurScore: number;             // 0–100 (higher = more blurry)
  brightness: number;            // 0–255 average
  hasGlare: boolean;
  isCropped: boolean;
  isRotated: boolean;
  resolution: { width: number; height: number };
  warnings: string[];
  suggestions: string[];
}

export interface ExtractedFields {
  // Common
  name?: string;
  dob?: string;
  gender?: string;
  address?: string;

  // Aadhaar-specific
  aadhaarNumber?: string;        // Masked: XXXX-XXXX-1234

  // PAN-specific
  panNumber?: string;

  // Passport / DL
  documentNumber?: string;
  expiryDate?: string;
  issueDate?: string;

  // FIR-specific
  firNumber?: string;
  policeStation?: string;
  officerName?: string;
  officerBatch?: string;
  incidentDate?: string;
  sections?: string[];           // BNSS sections

  // Medical
  hospitalName?: string;
  doctorName?: string;
  diagnosis?: string;

  // Confidence per field
  fieldConfidence: Record<string, number>;
}

export interface VerificationResult {
  status: VerificationStatus;
  overallScore: number;          // 0–100
  nameMatch?: {
    caseValue: string;
    documentValue: string;
    matchScore: number;
    verdict: 'match' | 'probable_match' | 'mismatch';
  };
  warnings: string[];
  positiveFields: string[];
  recommendations: string[];
}

export interface SyncQueueItem {
  id?: number;                   // Auto-incremented
  operationType: SyncOperationType;
  entityId: string;
  entityType: 'case' | 'message' | 'document' | 'timeline' | 'readiness';
  payload: Record<string, unknown>;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: number;
  nextAttempt?: number;
  error?: string;
  createdAt: number;
  priority: 1 | 2 | 3;          // 1 = highest
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  eventType: 'case_created' | 'fir_filed' | 'document_uploaded' | 'document_verified'
    | 'ai_analysis' | 'legal_notice' | 'court_date' | 'police_contact' | 'custom';
  title: string;
  description?: string;
  date: number;                  // Unix timestamp
  metadata?: Record<string, unknown>;
  createdAt: number;
  syncStatus: SyncStatus;
}

export interface ReadinessState {
  id: string;                    // Equals caseId
  caseId: string;
  documentScore: number;         // 0–100
  statementScore: number;
  timelineScore: number;
  verificationScore: number;
  overallScore: number;
  missingItems: string[];
  recommendations: string[];
  lastCalculated: number;
  syncStatus: SyncStatus;
}

export interface AppSettings {
  id: 'singleton';
  preferLocalAI: boolean;
  ollamaEndpoint: string;
  localModelName: string;
  autoSync: boolean;
  syncIntervalMs: number;
  language: string;
  offlineModeAcknowledged: boolean;
  geminiApiKey?: string;         // Encrypted
  updatedAt: number;
}

export interface PendingUpload {
  id: string;
  documentId: string;
  caseId: string;
  localBlob?: Blob;
  fileName: string;
  mimeType: string;
  uploadedAt?: number;
  status: 'pending' | 'uploading' | 'done' | 'failed';
  attempts: number;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEXIE DATABASE CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class FirstReportDB extends Dexie {
  // Tables
  cases!: EntityTable<LocalCase, 'id'>;
  messages!: EntityTable<LocalMessage, 'id'>;
  documents!: EntityTable<LocalDocument, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  timelineEvents!: EntityTable<TimelineEvent, 'id'>;
  readinessState!: EntityTable<ReadinessState, 'id'>;
  appSettings!: EntityTable<AppSettings, 'id'>;
  pendingUploads!: EntityTable<PendingUpload, 'id'>;

  constructor() {
    super('FirstReportDB');

    this.version(1).stores({
      // Primary key + indexed fields
      cases:
        'id, remoteId, status, language, urgency, syncStatus, createdAt, updatedAt',

      messages:
        'id, caseId, role, syncStatus, createdAt',

      documents:
        'id, caseId, type, verificationStatus, syncStatus, createdAt',

      // syncQueue uses auto-increment id
      syncQueue:
        '++id, operationType, entityId, entityType, priority, nextAttempt, createdAt',

      timelineEvents:
        'id, caseId, eventType, date, syncStatus, createdAt',

      readinessState:
        'id, caseId, overallScore, lastCalculated',

      appSettings:
        'id',

      pendingUploads:
        'id, documentId, caseId, status, attempts',
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

let _db: FirstReportDB | null = null;

export function getDB(): FirstReportDB {
  if (typeof window === 'undefined') {
    throw new Error('FirstReportDB can only be used in the browser');
  }
  if (!_db) {
    _db = new FirstReportDB();
  }
  return _db;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'singleton',
  preferLocalAI: false,
  ollamaEndpoint: 'http://localhost:11434',
  localModelName: 'gemma2:2b',
  autoSync: true,
  syncIntervalMs: 30_000,
  language: 'hi-IN',
  offlineModeAcknowledged: false,
  updatedAt: Date.now(),
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export async function initSettings(): Promise<AppSettings> {
  const db = getDB();
  const existing = await db.appSettings.get('singleton');
  if (existing) return existing;
  await db.appSettings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function getCaseWithDocuments(caseId: string) {
  const db = getDB();
  const [caseData, documents, messages, timeline, readiness] = await Promise.all([
    db.cases.get(caseId),
    db.documents.where('caseId').equals(caseId).toArray(),
    db.messages.where('caseId').equals(caseId).sortBy('createdAt'),
    db.timelineEvents.where('caseId').equals(caseId).sortBy('date'),
    db.readinessState.get(caseId),
  ]);
  return { caseData, documents, messages, timeline, readiness };
}

export async function addToSyncQueue(
  operationType: SyncOperationType,
  entityId: string,
  entityType: SyncQueueItem['entityType'],
  payload: Record<string, unknown>,
  priority: 1 | 2 | 3 = 2,
): Promise<void> {
  const db = getDB();
  // FIX: nextAttempt MUST be 0 (numeric sentinel for "immediate").
  // Sync engine queries .where('nextAttempt').belowOrEqual(Date.now()).
  // Items without nextAttempt (undefined) never match that query — they're
  // silently ignored forever. Setting it to 0 ensures they run on the next cycle.
  await db.syncQueue.add({
    operationType,
    entityId,
    entityType,
    payload,
    retryCount:   0,
    maxRetries:   5,
    nextAttempt:  0,   // 0 = immediate (must be numeric, not undefined)
    createdAt:    Date.now(),
    priority,
  });
}

export async function calculateReadiness(caseId: string): Promise<ReadinessState> {
  const db = getDB();
  const documents = await db.documents.where('caseId').equals(caseId).toArray();
  const messages = await db.messages.where('caseId').equals(caseId).toArray();
  const timeline = await db.timelineEvents.where('caseId').equals(caseId).toArray();

  const verifiedDocs = documents.filter(d =>
    ['Verified', 'Partial Match'].includes(d.verificationStatus),
  ).length;
  const totalDocs = documents.length;
  const documentScore = totalDocs === 0 ? 0 : Math.min(100, (verifiedDocs / Math.max(totalDocs, 1)) * 100);

  const userMessages = messages.filter(m => m.role === 'user').length;
  const statementScore = Math.min(100, userMessages * 10);

  const timelineScore = Math.min(100, timeline.length * 20);

  const verificationScore = documents.reduce((sum, d) => sum + (d.verificationScore ?? 0), 0)
    / Math.max(documents.length, 1);

  const overallScore = Math.round(
    documentScore * 0.35 + statementScore * 0.25 + timelineScore * 0.15 + verificationScore * 0.25,
  );

  const missingItems: string[] = [];
  if (totalDocs === 0) missingItems.push('कोई दस्तावेज़ अपलोड नहीं हुआ');
  if (userMessages < 3) missingItems.push('बयान अधूरा है');
  if (timeline.length === 0) missingItems.push('घटना की समयरेखा नहीं बनी');
  if (!documents.find(d => d.type === 'Aadhaar Card')) missingItems.push('आधार कार्ड नहीं है');

  const recommendations: string[] = [];
  if (verifiedDocs < totalDocs) recommendations.push('दस्तावेज़ों को बेहतर क्वालिटी में स्कैन करें');
  if (statementScore < 50) recommendations.push('अपना पूरा बयान दर्ज करें');

  const state: ReadinessState = {
    id: caseId,
    caseId,
    documentScore: Math.round(documentScore),
    statementScore: Math.round(statementScore),
    timelineScore: Math.round(timelineScore),
    verificationScore: Math.round(verificationScore),
    overallScore,
    missingItems,
    recommendations,
    lastCalculated: Date.now(),
    syncStatus: 'local',
  };

  await db.readinessState.put(state);
  return state;
}
