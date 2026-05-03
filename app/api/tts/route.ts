import { NextRequest, NextResponse } from 'next/server';
import { sarvamTTS } from '@/lib/sarvam';
import { LANG_BY_CODE, type LangCode } from '@/lib/i18n';

/**
 * POST /api/tts — Text-to-Speech via Sarvam bulbul:v3.
 * Returns audio as WAV blob.
 *
 * Defensive: normalizes incoming language code, falls back to hi-IN
 * for unknown / missing codes, and aliases or-IN → od-IN for Sarvam.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, language } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Normalize / validate language
    const aliasMap: Record<string, LangCode> = {
      'or-IN': 'od-IN',
      'or':    'od-IN',
    };
    const candidate = (typeof language === 'string' ? language : 'hi-IN');
    const aliased = aliasMap[candidate] ?? candidate;
    const lang: LangCode = (LANG_BY_CODE as Record<string, unknown>)[aliased]
      ? (aliased as LangCode)
      : 'hi-IN';

    const result = await sarvamTTS(text, lang);

    if (result.success && result.audio) {
      return new NextResponse(result.audio, {
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return NextResponse.json(
      { error: result.error || 'TTS failed' },
      { status: 503 }
    );
  } catch {
    return NextResponse.json({ error: 'TTS error' }, { status: 500 });
  }
}
