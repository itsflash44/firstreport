import { NextRequest, NextResponse } from 'next/server';
import { LANG_BY_CODE, type LangCode } from '@/lib/i18n';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

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

    formData.set('language', sarvamCode);
    // Python FastAPI backend reads this as `lang_code: str = Form("hi-IN")`.
    // The 'language' field above is kept for forward-compat; lang_code is what
    // the backend actually uses — without it, Python silently defaulted to hi-IN
    // for every language, making STT always run in Hindi mode.
    formData.set('lang_code', sarvamCode);

    const res = await fetch(`${PYTHON_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { transcript: '', success: false, error: 'Backend unavailable' },
      { status: 503 }
    );
  }
}
