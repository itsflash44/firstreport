import { NextRequest, NextResponse } from 'next/server';
import { saveOfficerSighting } from '@/lib/db/sessions';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/officer — Proxy to Python /api/officer for notice board photo processing.
 * Persists the extracted officer info to Supabase via Prisma.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const sessionId = formData.get('session_id') as string | null;

    // Forward to Python (keep formData as-is — Python reads the 'image' field)
    const res = await fetch(`${PYTHON_URL}/api/officer`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    // ── DB: save officer sighting ─────────────────────────────────────────────
    if (sessionId && data.success && data.officer_info) {
      const o = data.officer_info;
      await saveOfficerSighting(sessionId, {
        name:        o.name,
        batchNumber: o.batch_number ?? null,
        posting:     o.posting ?? null,
        stationName: o.station_name ?? '',
        source:      'PHOTO',
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Officer photo processing failed' },
      { status: 503 },
    );
  }
}
