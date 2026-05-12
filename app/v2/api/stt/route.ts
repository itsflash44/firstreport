import { NextRequest, NextResponse } from 'next/server';
import { normalizeLangCode } from '@/v2/types/i18n';
import type { LangCode } from '@/v2/types/index';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get('audio');
    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json(
        { transcript: '', success: false, error: 'No audio provided' },
        { status: 400 },
      );
    }

    const rawLang = String(formData.get('language') ?? 'hi-IN');
    const langCode = normalizeLangCode(rawLang as LangCode);

    const proxyForm = new FormData();
    proxyForm.append('audio', audio, 'recording.webm');
    proxyForm.append('language', langCode);
    proxyForm.append('lang_code', langCode);

    const res = await fetch(`${PYTHON_URL}/api/transcribe`, {
      method: 'POST',
      body: proxyForm,
    });

    if (!res.ok) {
      return NextResponse.json(
        { transcript: '', success: false, error: `Backend error: ${res.status}` },
        { status: res.status >= 400 && res.status < 500 ? res.status : 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json({
      transcript: data.transcript || '',
      success: Boolean(data.transcript),
      error: data.error,
    });
  } catch {
    return NextResponse.json(
      { transcript: '', success: false, error: 'STT service unavailable' },
      { status: 503 },
    );
  }
}
