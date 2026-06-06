import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

async function fetchOptionalRows<T>(query: PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  try {
    const { data } = await query;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const caseId = params.id;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: 'Cloud sync not configured' }, { status: 404 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Try to fetch from `cases` table (Dexie sync)
    let caseData = null;
    let { data: syncCase } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (syncCase) {
      caseData = syncCase;
    } else {
      // 2. Try to fetch from `legal_cases` table (localStorage sync)
      let { data: legalCase } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('id', caseId)
        .single();
      
      if (legalCase) {
        // Map from snake_case to camelCase
        caseData = {
          id: legalCase.id,
          title: legalCase.title,
          status: legalCase.status,
          language: legalCase.language,
          severity: legalCase.severity,
          personaId: legalCase.persona_id,
          incidentSummary: legalCase.incident_summary,
          victimName: legalCase.victim_name,
          policeStation: legalCase.police_station,
          bnssSection: legalCase.bnss_section,
          statutesCited: legalCase.statutes_cited,
          userId: legalCase.user_id,
          createdAt: new Date(legalCase.created_at).getTime(),
          updatedAt: new Date(legalCase.updated_at).getTime(),
        };
      }
    }

    if (!caseData) {
      return NextResponse.json({ ok: false, error: 'Case not found' }, { status: 404 });
    }

    // Attempt to fetch related data
    const messages = await fetchOptionalRows(
      supabase
        .from('messages')
        .select('*')
        .eq('caseId', caseId)
        .order('createdAt', { ascending: true }),
    );

    const documents = await fetchOptionalRows(
      supabase
        .from('documents')
        .select('*')
        .eq('case_id', caseId),
    );

    const timeline = await fetchOptionalRows(
      supabase
        .from('timeline_events')
        .select('*')
        .eq('caseId', caseId),
    );

    return NextResponse.json({
      ok: true,
      case: caseData,
      messages,
      documents,
      timeline,
    });

  } catch (err) {
    console.error('[Hydration API] Error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
