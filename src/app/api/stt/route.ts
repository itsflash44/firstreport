import { NextRequest, NextResponse } from 'next/server';
import { LANG_BY_CODE, type LangCode } from '@/lib/i18n';
import { sarvamSTT } from '@/lib/sarvam';

/**
 * POST /api/stt — Proxy to Sarvam STT via Python backend.
 * Accepts audio file + language, returns transcript.
 *
 * Defensive normalization: maps any browser-style BCP47 code (e.g. or-IN)
 * onto the Sarvam-supported code (od-IN). Defaults to hi-IN if missing or unknown.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Attempt to extract the file object
    const file = formData.get('audio') || formData.get('file');
    if (!file || typeof (file as Blob).arrayBuffer !== 'function') {
      return NextResponse.json({ transcript: '', success: false, error: 'No audio file provided' }, { status: 400 });
    }

    const raw = String(formData.get('language') ?? 'hi-IN');
    // Normalize browser BCP47 → Sarvam code
    const aliasMap: Record<string, LangCode> = {
      'or-IN': 'od-IN', // Odia: ISO 639-1 'or' → Sarvam 'od'
      'or':    'od-IN',
    };
    const aliased = aliasMap[raw] ?? raw;
    const sarvamCode: LangCode = (LANG_BY_CODE as Record<string, unknown>)[aliased]
      ? (aliased as LangCode)
      : 'hi-IN';

    // Call native Sarvam STT from TypeScript
    const result = await sarvamSTT(file as Blob, sarvamCode);
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { transcript: '', success: false, error: error?.message || 'STT failed' },
      { status: 503 }
    );
  }
}
