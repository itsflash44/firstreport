import { NextRequest, NextResponse } from 'next/server';
import { saveClassification } from '@/lib/db/sessions';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/classify — Proxies incident summary to Python for BNSS classification.
 * Persists the result to Supabase via Prisma.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${PYTHON_URL}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: body.summary || body.transcript,
        lang_code: body.language || 'hi-IN',
      }),
    });

    const data = await res.json();

    // ── DB: persist classification ────────────────────────────────────────────
    const sessionId: string = body.sessionId || '';
    if (sessionId && data.success && data.classification) {
      const c = data.classification;
      await saveClassification(sessionId, {
        bnssSection:      c.bnss_section ?? c.bnssSection ?? '',
        offenseName:      c.offense_name ?? c.offenseName ?? '',
        offenseNameHindi: c.offense_name_hindi ?? c.offenseNameHindi ?? '',
        isCognizable:     c.is_cognizable ?? c.isCognizable ?? false,
        confidence:       mapConfidence(c.confidence),
        rationaleHindi:   c.rationale_hindi ?? c.rationaleHindi ?? '',
        punishment:       c.punishment ?? null,
        multipleSections: c.multiple_sections ?? c.multipleSections ?? [],
      });
    }

    return NextResponse.json({ ...data, sessionId });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Classification failed' },
      { status: 503 },
    );
  }
}

function mapConfidence(raw: string | undefined): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (!raw) return 'MEDIUM';
  const up = raw.toUpperCase();
  if (up === 'HIGH') return 'HIGH';
  if (up === 'LOW') return 'LOW';
  return 'MEDIUM';
}
