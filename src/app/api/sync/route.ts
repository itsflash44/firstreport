/**
 * FirstReport — Sync API Route
 *
 * Receives queued operations from the offline sync engine
 * and persists them to Supabase.
 *
 * Handles: cases, messages, documents, timeline events, readiness state
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL   ?? '';
// SECURITY FIX: sync operations require SERVICE_ROLE_KEY to bypass RLS.
// NEVER fall back to the anon key here — anon key lacks INSERT/UPDATE permissions
// on most tables and will silently fail or leak data to unauthenticated users.
// If SERVICE_ROLE_KEY is not set, operate in offline-only mode (return success).
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function getSupabase() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }, // server-side: no session storage
  });
}

interface SyncPayload {
  operation: string;
  entityId: string;
  entityType: 'case' | 'message' | 'document' | 'timeline' | 'readiness';
  payload: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SyncPayload;
    const { operation, entityId, entityType, payload } = body;

    const supabase = getSupabase();

    // If Supabase not configured, return success (offline-only mode)
    if (!supabase) {
      return NextResponse.json({ ok: true, mode: 'offline-only' });
    }

    let result: unknown;

    switch (entityType) {
      case 'case': {
        if (operation === 'CREATE_CASE') {
          const { data, error } = await supabase
            .from('cases')
            .upsert({
              id: entityId,
              ...payload,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();
          if (error) throw error;
          result = data;
        } else if (operation === 'UPDATE_CASE') {
          const { data, error } = await supabase
            .from('cases')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', entityId)
            .select()
            .single();
          if (error) throw error;
          result = data;
        }
        break;
      }

      case 'message': {
        const { data, error } = await supabase
          .from('messages')
          .upsert({ id: entityId, ...payload })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'document': {
        const { data, error } = await supabase
          .from('documents')
          .upsert({
            id: entityId,
            case_id: payload.caseId,
            type: payload.type,
            verification_status: payload.verificationStatus,
            quality_score: payload.qualityScore ?? null,
            verification_score: payload.verificationScore ?? null,
            // Don't sync OCR raw text — too large
            extracted_name: (payload.ocrData as Record<string, unknown> | undefined)
              ? ((payload.ocrData as Record<string, unknown>).extractedFields as Record<string, unknown>)?.name
              : null,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'timeline': {
        const { data, error } = await supabase
          .from('timeline_events')
          .upsert({ id: entityId, ...payload })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'readiness': {
        const { data, error } = await supabase
          .from('readiness_state')
          .upsert({ id: entityId, case_id: entityId, ...payload })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      default:
        return NextResponse.json({ ok: false, error: 'Unknown entity type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data: result });

  } catch (err) {
    console.error('[Sync API] Error:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 },
    );
  }
}

// GET — return sync status / pending queue count
export async function GET() {
  return NextResponse.json({
    ok: true,
    supabaseConfigured: !!(supabaseUrl && serviceRoleKey),
    timestamp: Date.now(),
  });
}
