import { NextRequest, NextResponse } from 'next/server';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/queue/retry
 * Triggers the Python backend to retry all pending Telegram deliveries.
 */
export async function POST(_req: NextRequest) {
  try {
    const res = await fetch(`${PYTHON_URL}/api/sync-queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ success: true, ...data });
  } catch {
    // Python may be down — return graceful failure
    return NextResponse.json({ success: false, error: 'Backend unavailable' }, { status: 503 });
  }
}
