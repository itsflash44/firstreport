import { NextRequest, NextResponse } from 'next/server';
import {
  createDocumentRecord,
  createEscalationTimers,
  updateSessionStatus,
  type DocType,
} from '@/lib/db/sessions';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

// Maps Python key → Prisma DocType enum
const DOC_TYPE_MAP: Record<string, DocType> = {
  sp_complaint:      'SP_COMPLAINT',
  dm_petition:       'DM_PETITION',
  hc_writ:           'HC_WRIT',
  accountability_doc: 'OFFICER_ACCOUNTABILITY',
};

/**
 * POST /api/generate-pdf — Proxies to Python for PDF generation.
 * After Python succeeds, creates Document records and EscalationTimers in Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${PYTHON_URL}/api/generate-docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    // ── DB: create Document rows + escalation timers ──────────────────────────
    const sessionId: string = body.sessionId || data.session_id || '';
    if (sessionId && data.success) {
      // Create one Document row per generated doc
      const docIds: Record<string, string> = {};
      for (const [key, docType] of Object.entries(DOC_TYPE_MAP)) {
        if (data.paths?.[key]) {
          const storagePath = `documents/${sessionId}/${key}.pdf`;
          const docId = await createDocumentRecord(sessionId, docType, storagePath);
          if (docId) docIds[key] = docId;
        }
      }
      // Escalation timers for DM (day 3) and HC (day 18)
      await createEscalationTimers(sessionId);
      // Mark session as DOCUMENTS_READY
      await updateSessionStatus(sessionId, 'DOCUMENTS_READY');

      return NextResponse.json({ ...data, sessionId, docIds });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, error: 'PDF generation failed' },
      { status: 503 },
    );
  }
}
