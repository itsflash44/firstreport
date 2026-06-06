/**
 * FirstReport — Server-Side DB Helper (Prisma)
 * =============================================
 * All Prisma writes go through this module.
 * Every function is wrapped in try/catch — DB failures must never crash the app.
 *
 * Schema: User, Session (with JSON fields for flexible data), OfflineQueue.
 * Data that would have gone into separate tables is stored in Session.entitiesJson
 * and Session.documentsJson as structured JSON blobs.
 */

import prisma from '@/lib/prisma';
import type { SessionStatus } from '@prisma/client';

// Local string literals for types removed from Prisma schema
export type TurnRole = 'USER' | 'AI';
export type DocType = 'SP_COMPLAINT' | 'DM_PETITION' | 'HC_WRIT' | 'OFFICER_ACCOUNTABILITY';
export type OfficerSource = 'VOICE' | 'PHOTO' | 'MANUAL';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// ─────────────────────────────────────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateSessionInput {
  userId?: string | null;
  language?: string;
  urgencyLevel?: number;
  personaId?: string;
  consentGiven?: boolean;
}

/** Create a new session row. Returns session id or null on failure. */
export async function createSession(data: CreateSessionInput): Promise<string | null> {
  try {
    const targetUserId = data.userId || 'anonymous_guest';

    // Ensure user exists to satisfy foreign key constraint.
    // FIX: never overwrite name — only set it on CREATE when genuinely unknown.
    // The real name comes from upsertUser() which runs after OTP/OAuth and has
    // access to user_metadata. Using a placeholder here so the FK is satisfied
    // without stomping the actual profile name.
    await prisma.user.upsert({
      where:  { id: targetUserId },
      update: {},   // ← never mutate existing rows from here
      create: {
        id:   targetUserId,
        name: data.userId ? null : 'Anonymous Guest',   // null = not yet known; upsertUser fills it
      },
    });

    const session = await prisma.session.create({
      data: {
        userId: targetUserId,
        language: data.language ?? 'hi-IN',
        rawTranscriptJson: JSON.stringify([]),
        incidentSummary: '',
        consentGiven: data.consentGiven ?? false,
        status: 'DRAFT',
        entitiesJson: {
          urgencyLevel: data.urgencyLevel ?? 1,
          personaId: data.personaId ?? 'standard',
        },
      },
    });
    return session.id;
  } catch (err) {
    console.error('[DB] createSession failed:', err);
    return null;
  }
}

/** Update session incident summary and status. */
export async function updateSessionSummary(
  sessionId: string,
  summary: string,
  status?: SessionStatus,
): Promise<void> {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        rawTranscriptJson: summary,
        incidentSummary: summary.slice(0, 500),
        ...(status ? { status } : {}),
      },
    });
  } catch (err) {
    console.error('[DB] updateSessionSummary failed:', err);
  }
}

/** Update session status only. */
export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
): Promise<void> {
  try {
    await prisma.session.update({ where: { id: sessionId }, data: { status } });
  } catch (err) {
    console.error('[DB] updateSessionStatus failed:', err);
  }
}

/** Get a session row. */
export async function getSession(sessionId: string) {
  try {
    return await prisma.session.findUnique({ where: { id: sessionId } });
  } catch (err) {
    console.error('[DB] getSession failed:', err);
    return null;
  }
}

/** List sessions for a user (for history page). */
export async function listUserSessions(userId: string, limit = 20) {
  try {
    return await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (err) {
    console.error('[DB] listUserSessions failed:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLARIFICATION TURNS — stored in rawTranscriptJson as a JSON array
// ─────────────────────────────────────────────────────────────────────────────

/** Add one clarification turn to a session (appended to rawTranscriptJson). */
export async function addClarificationTurn(
  sessionId: string,
  role: TurnRole,
  text: string,
  turnIndex: number,
): Promise<void> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { rawTranscriptJson: true },
    });
    let turns: Array<{ role: TurnRole; text: string; turnIndex: number }> = [];
    try {
      const parsed = JSON.parse(session?.rawTranscriptJson ?? '[]');
      if (Array.isArray(parsed)) turns = parsed;
    } catch { /* start fresh */ }

    turns.push({ role, text, turnIndex });
    await prisma.session.update({
      where: { id: sessionId },
      data: { rawTranscriptJson: JSON.stringify(turns) },
    });
  } catch (err) {
    console.error('[DB] addClarificationTurn failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASSIFICATION — stored in entitiesJson + direct Session fields
// ─────────────────────────────────────────────────────────────────────────────

export interface ClassificationInput {
  bnssSection: string;
  offenseName?: string;
  offenseNameHindi: string;
  isCognizable: boolean;
  confidence?: ConfidenceLevel;
  rationaleHindi: string;
  punishment?: string;
  multipleSections?: string[];
}

/** Save BNSS classification result and mark session as CLASSIFIED. */
export async function saveClassification(
  sessionId: string,
  data: ClassificationInput,
): Promise<void> {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        bnssSection: data.bnssSection,
        offenseType: data.offenseName ?? '',
        classificationConfidence: data.confidence === 'HIGH' ? 0.9 : data.confidence === 'MEDIUM' ? 0.7 : 0.5,
        status: 'CLASSIFIED',
        entitiesJson: {
          classification: {
            bnssSection: data.bnssSection,
            offenseName: data.offenseName ?? '',
            offenseNameHindi: data.offenseNameHindi,
            isCognizable: data.isCognizable,
            confidence: data.confidence ?? 'MEDIUM',
            rationaleHindi: data.rationaleHindi,
            punishment: data.punishment ?? null,
            multipleSections: data.multipleSections ?? [],
          },
        },
      },
    });
  } catch (err) {
    console.error('[DB] saveClassification failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFICER SIGHTING — stored in entitiesJson
// ─────────────────────────────────────────────────────────────────────────────

export interface OfficerSightingInput {
  name?: string;
  batchNumber?: string;
  posting?: string;
  stationName?: string;
  source?: OfficerSource;
}

/** Save officer info extracted from voice or photo (merged into entitiesJson). */
export async function saveOfficerSighting(
  sessionId: string,
  data: OfficerSightingInput,
): Promise<void> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { entitiesJson: true },
    });
    const existing = (session?.entitiesJson as Record<string, unknown>) ?? {};
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        entitiesJson: {
          ...existing,
          officerSighting: {
            name: data.name ?? 'कर्तव्य अधिकारी',
            batchNumber: data.batchNumber ?? null,
            posting: data.posting ?? null,
            stationName: data.stationName ?? '',
            source: data.source ?? 'VOICE',
          },
        },
      },
    });
  } catch (err) {
    console.error('[DB] saveOfficerSighting failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTS — stored in documentsJson
// ─────────────────────────────────────────────────────────────────────────────

/** Create a document record with PENDING status. Returns a synthetic id or null. */
export async function createDocumentRecord(
  sessionId: string,
  docType: DocType,
  storagePath: string,
): Promise<string | null> {
  try {
    const docId = `${sessionId}-${docType.toLowerCase()}`;
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { documentsJson: true },
    });
    const existing = (session?.documentsJson as Record<string, unknown>) ?? {};
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        documentsJson: Object.assign({}, existing, {
          [docType]: { id: docId, storagePath, status: 'PENDING' },
        }) as object,
      },
    });
    return docId;
  } catch (err) {
    console.error('[DB] createDocumentRecord failed:', err);
    return null;
  }
}

/** Mark a document as READY with its storage URL. */
export async function updateDocumentReady(
  documentId: string,
  storageUrl: string,
  fileSizeBytes?: number,
): Promise<void> {
  try {
    // documentId format: "{sessionId}-{docType}"
    const lastDash = documentId.lastIndexOf('-');
    const sessionId = documentId.slice(0, lastDash);
    const docKey = documentId.slice(lastDash + 1).toUpperCase();

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { documentsJson: true },
    });
    const existing = (session?.documentsJson as Record<string, unknown>) ?? {};
    const docEntry = (existing[docKey] as Record<string, unknown>) ?? {};
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        documentsJson: Object.assign({}, existing, {
          [docKey]: Object.assign({}, docEntry, { status: 'READY', storageUrl, fileSizeBytes: fileSizeBytes ?? null }),
        }) as object,
      },
    });
  } catch (err) {
    console.error('[DB] updateDocumentReady failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCALATION TIMERS — stored in documentsJson
// ─────────────────────────────────────────────────────────────────────────────

/** Record DM and HC escalation unlock dates in documentsJson. */
export async function createEscalationTimers(sessionId: string): Promise<void> {
  try {
    const now = new Date();
    const dmUnlock = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const hcUnlock = new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString();

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { documentsJson: true },
    });
    const existing = (session?.documentsJson as Record<string, unknown>) ?? {};
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        documentsJson: {
          ...existing,
          escalationTimers: { dmUnlock, hcUnlock },
        },
      },
    });
  } catch (err) {
    console.error('[DB] createEscalationTimers failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TELEGRAM DELIVERY — logged into OfflineQueue
// ─────────────────────────────────────────────────────────────────────────────

/** Record Telegram delivery attempt. */
export async function recordTelegramDelivery(
  sessionId: string,
  documentId: string | null,
  status: 'SENT' | 'FAILED' | 'QUEUED',
  errorMessage?: string,
): Promise<void> {
  try {
    await prisma.offlineQueue.create({
      data: {
        sessionId,
        telegramPayload: { documentId, status, errorMessage: errorMessage ?? null },
        sentAt: status === 'SENT' ? new Date() : null,
      },
    });
  } catch (err) {
    console.error('[DB] recordTelegramDelivery failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE QUEUE
// ─────────────────────────────────────────────────────────────────────────────

export interface QueuePayload {
  filename: string;
  caption: string;
  chatId: string;
}

/** Add an item to the persistent offline queue. */
export async function enqueueOfflineItem(
  sessionId: string,
  documentId: string | null,
  payload: QueuePayload,
): Promise<void> {
  try {
    await prisma.offlineQueue.create({
      data: {
        sessionId,
        telegramPayload: { ...payload, documentId },
      },
    });
  } catch (err) {
    console.error('[DB] enqueueOfflineItem failed:', err);
  }
}

/** Get all pending offline queue items (sentAt is null = not yet sent). */
export async function getPendingQueueItems() {
  try {
    return await prisma.offlineQueue.findMany({
      where: { sentAt: null },
      orderBy: { createdAt: 'asc' },
    });
  } catch (err) {
    console.error('[DB] getPendingQueueItems failed:', err);
    return [];
  }
}

/** Mark a queue item as sent. */
export async function markQueueItemSent(queueId: string): Promise<void> {
  try {
    await prisma.offlineQueue.update({
      where: { id: queueId },
      data: { sentAt: new Date() },
    });
  } catch (err) {
    console.error('[DB] markQueueItemSent failed:', err);
  }
}
