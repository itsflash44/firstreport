import { NextRequest, NextResponse } from 'next/server';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { summary, classification, crimeInput, language, persona } = body;

    if (!summary || !classification) {
      return NextResponse.json(
        { success: false, error: 'Missing summary or classification' },
        { status: 400 },
      );
    }

    const res = await fetch(`${PYTHON_URL}/api/generate-docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary,
        classification,
        crime_input: crimeInput,
        language: language || 'hi-IN',
        persona: persona || 'standard',
      }),
    });

    const contentType = res.headers.get('content-type') ?? '';

    if (contentType.includes('application/pdf')) {
      const pdf = await res.arrayBuffer();
      const disposition = res.headers.get('content-disposition') ?? '';
      const filenameMatch = disposition.match(/filename="?([^";\s]+)"?/);
      const filename = filenameMatch?.[1] ?? 'firstreport.pdf';

      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Backend error: ${res.status}` },
        { status: res.status >= 400 && res.status < 500 ? res.status : 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, error: 'PDF generation unavailable' },
      { status: 503 },
    );
  }
}
