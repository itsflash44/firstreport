import { NextRequest, NextResponse } from 'next/server';
import { normalizeLangCode } from '@/v2/types/i18n';
import type { LangCode } from '@/v2/types/index';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';

const SPEAKER: Partial<Record<string, string>> = {
  'hi-IN': 'priya',
  'en-IN': 'ishita',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    if (!SARVAM_API_KEY) {
      return NextResponse.json({ error: 'TTS not configured' }, { status: 503 });
    }

    const lang = normalizeLangCode((body.language ?? 'hi-IN') as LangCode);

    const requestBody: Record<string, unknown> = {
      inputs: [text],
      target_language_code: lang,
      model: 'bulbul:v3',
    };
    const speaker = SPEAKER[lang];
    if (speaker) requestBody.speaker = speaker;

    const res = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Sarvam TTS error: ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    if (data.audios?.[0]) {
      const binaryString = atob(data.audios[0]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new NextResponse(bytes.buffer, {
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return NextResponse.json({ error: 'TTS returned no audio' }, { status: 502 });
  } catch {
    return NextResponse.json({ error: 'TTS service unavailable' }, { status: 503 });
  }
}
