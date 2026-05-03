import { NextRequest, NextResponse } from 'next/server';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/clarify — Proxies to Python /api/clarify.
 * Sends chat history, gets AI follow-up question or completion signal.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${PYTHON_URL}/api/clarify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: body.transcript,
        history: body.history || [],
        lang_code: body.language || 'hi-IN',
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Return isComplete: false so the chat UI shows an error message
    // rather than redirecting the user to the classify screen.
    return NextResponse.json(
      { question: null, isComplete: false, summary: '' },
      { status: 503 }
    );
  }
}
