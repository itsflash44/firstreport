import { NextRequest, NextResponse } from 'next/server';
import { normalizeLangCode } from '@/v2/types/i18n';
import type { LangCode } from '@/v2/types/index';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, history, language, persona } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { question: null, isComplete: false, summary: '', error: 'No transcript' },
        { status: 400 },
      );
    }

    const langCode = normalizeLangCode((language ?? 'hi-IN') as LangCode);

    const res = await fetch(`${PYTHON_URL}/api/clarify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        history: history || [],
        lang_code: langCode,
        persona: persona || 'standard',
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { question: null, isComplete: false, summary: '', error: `Backend error: ${res.status}` },
        { status: res.status >= 400 && res.status < 500 ? res.status : 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json({
      question: data.question ?? null,
      isComplete: Boolean(data.isComplete ?? data.is_complete),
      summary: data.summary ?? '',
    });
  } catch {
    return NextResponse.json(
      { question: null, isComplete: false, summary: '' },
      { status: 503 },
    );
  }
}
