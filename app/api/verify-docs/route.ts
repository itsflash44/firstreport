import { NextRequest, NextResponse } from 'next/server';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/verify-docs
 * Proxies to Python /api/verify-docs.
 * Body: { bnss_section, offense_name, incident, existing_docs? }
 * Returns: { success, verification: LegalDocumentVerification }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${PYTHON_URL}/api/verify-docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bnss_section:  body.bnss_section  ?? '',
        offense_name:  body.offense_name  ?? '',
        incident:      body.incident      ?? '',
        existing_docs: body.existing_docs ?? [],
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[verify-docs proxy]', err);
    return NextResponse.json(
      { success: false, error: 'Document verification unavailable' },
      { status: 503 },
    );
  }
}
