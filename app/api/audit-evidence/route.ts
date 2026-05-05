import { NextRequest, NextResponse } from 'next/server';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/audit-evidence
 * Accepts multipart/form-data with an "image" field.
 * Proxies to Python /api/audit-evidence (Gemma 4 Vision).
 * Returns: { success, audit: { overall_quality, clarity_score, feedback_hindi, ... } }
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const res = await fetch(`${PYTHON_URL}/api/audit-evidence`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[audit-evidence proxy]', err);
    return NextResponse.json(
      { success: false, error: 'Evidence audit unavailable' },
      { status: 503 },
    );
  }
}
