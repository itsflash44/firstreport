import { NextRequest, NextResponse } from 'next/server';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/explain-law
 * Proxies to Python /api/explain-law.
 * Body: { bnss_section, offense_name, incident }
 * Returns: { success, explanation: string }  — plain Hindi, TTS-ready
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${PYTHON_URL}/api/explain-law`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bnss_section: body.bnss_section ?? '',
        offense_name: body.offense_name ?? '',
        incident:     body.incident     ?? '',
      }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[explain-law proxy]', err);
    return NextResponse.json(
      { success: false, error: 'Legal explainer unavailable' },
      { status: 503 },
    );
  }
}
