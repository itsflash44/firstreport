import { NextRequest, NextResponse } from 'next/server';
import { normalizeLangCode } from '@/v2/types/i18n';
import type { LangCode } from '@/v2/types/index';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { summary, language, persona } = body;

    if (!summary || typeof summary !== 'string') {
      return NextResponse.json(
        { success: false, classification: null, crimeInput: null, error: 'No summary' },
        { status: 400 },
      );
    }

    const langCode = normalizeLangCode((language ?? 'hi-IN') as LangCode);

    const res = await fetch(`${PYTHON_URL}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: summary,
        lang_code: langCode,
        persona: persona || 'standard',
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, classification: null, crimeInput: null, error: `Backend error: ${res.status}` },
        { status: res.status >= 400 && res.status < 500 ? res.status : 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json({
      success: Boolean(data.success ?? data.classification),
      classification: data.classification ?? null,
      crimeInput: data.crimeInput ?? data.crime_input ?? null,
    });
  } catch {
    return NextResponse.json(
      { success: false, classification: null, crimeInput: null, error: 'Classification unavailable' },
      { status: 503 },
    );
  }
}
