/**
 * FirstReport — Legal Journey Sync API
 *
 * Receives a LegalCase object from legalJourney.ts::syncCaseToServer()
 * and persists it to Supabase (or accepts gracefully when offline-only).
 *
 * This was a MISSING ENDPOINT — syncCaseToServer() was silently failing
 * on every case creation and update because this route didn't exist.
 *
 * Security:
 *   - Uses SERVICE_ROLE_KEY for upsert (bypasses RLS for case writes)
 *   - Falls back to ANON key in read-only queries only
 *   - Never exposes secrets to client
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? '';
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY    ?? '';
const ANON_KEY          = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

interface LegalCasePayload {
  id: string;
  title?: string;
  status?: string;
  language?: string;
  severity?: string;
  personaId?: string;
  incidentSummary?: string;
  victimName?: string;
  policeStation?: string;
  bnssSection?: string;
  statutesCited?: string[];
  createdAt?: number;
  updatedAt?: number;
  documentsGenerated?: unknown[];
  conversations?: unknown[];
  evidence?: unknown[];
  timeline?: unknown[];
  userId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as LegalCasePayload;

    if (!body.id) {
      return NextResponse.json({ ok: false, error: 'Case ID required' }, { status: 400 });
    }

    // ── Offline-only mode ──────────────────────────────────────────────────
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      // No cloud storage configured — this is expected in offline-first deployments.
      // localStorage is the ground truth. Accept and return success.
      return NextResponse.json({
        ok:   true,
        mode: 'offline-only',
        id:   body.id,
        msg:  'Case stored locally. Configure Supabase to enable cloud sync.',
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Upsert into `legal_cases` table (create or update)
    const { error } = await supabase
      .from('legal_cases')
      .upsert({
        id:                body.id,
        title:             body.title             ?? 'Untitled Case',
        status:            body.status            ?? 'active',
        language:          body.language          ?? 'hi-IN',
        severity:          body.severity          ?? 'normal',
        persona_id:        body.personaId         ?? 'standard',
        incident_summary:  body.incidentSummary   ?? '',
        victim_name:       body.victimName        ?? null,
        police_station:    body.policeStation     ?? null,
        bnss_section:      body.bnssSection       ?? null,
        statutes_cited:    body.statutesCited     ?? [],
        user_id:           body.userId            ?? null,
        created_at: body.createdAt
          ? new Date(body.createdAt).toISOString()
          : new Date().toISOString(),
        updated_at: body.updatedAt
          ? new Date(body.updatedAt).toISOString()
          : new Date().toISOString(),
        // Store document + conversation counts — not full payloads (too large)
        documents_count:     (body.documentsGenerated ?? []).length,
        conversations_count: (body.conversations ?? []).length,
        evidence_count:      (body.evidence ?? []).length,
      }, { onConflict: 'id' });

    if (error) {
      // Table may not exist yet — non-fatal (offline mode still works)
      console.warn('[legal-journey] Supabase upsert error (non-fatal):', error.message);
      return NextResponse.json({
        ok:    false,
        error: error.message,
        hint:  'Ensure legal_cases table exists in Supabase. Local data is safe.',
      }, { status: 200 }); // 200 not 500 — client treats non-ok as informational
    }

    return NextResponse.json({ ok: true, id: body.id });

  } catch (err) {
    console.error('[legal-journey] Unhandled error:', err);
    // Return 200 always — client must not fail when cloud sync fails
    return NextResponse.json({
      ok:    false,
      error: err instanceof Error ? err.message : 'Sync failed',
      hint:  'Local data is safe in localStorage.',
    }, { status: 200 });
  }
}

// GET — health check for sync status
export async function GET() {
  return NextResponse.json({
    ok:                 true,
    supabaseConfigured: !!(SUPABASE_URL && SERVICE_ROLE_KEY),
    mode:               SERVICE_ROLE_KEY ? 'cloud-sync' : 'offline-only',
    ts:                 Date.now(),
  });
}
