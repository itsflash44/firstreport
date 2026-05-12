import { NextRequest, NextResponse } from 'next/server';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';
    let proxyBody: BodyInit;
    let proxyHeaders: Record<string, string> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const doc = formData.get('document');
      const sessionId = formData.get('sessionId');

      if (!doc || !(doc instanceof Blob)) {
        return NextResponse.json(
          { success: false, error: 'No document provided' },
          { status: 400 },
        );
      }

      const proxyForm = new FormData();
      proxyForm.append('document', doc, formData.get('filename')?.toString() ?? 'firstreport.pdf');
      if (sessionId) proxyForm.append('sessionId', sessionId.toString());
      const chatId = formData.get('chatId');
      if (chatId) proxyForm.append('chatId', chatId.toString());

      proxyBody = proxyForm;
    } else {
      const body = await req.json();
      if (!body.sessionId) {
        return NextResponse.json(
          { success: false, error: 'No sessionId provided' },
          { status: 400 },
        );
      }
      proxyBody = JSON.stringify(body);
      proxyHeaders = { 'Content-Type': 'application/json' };
    }

    const res = await fetch(`${PYTHON_URL}/api/send-telegram`, {
      method: 'POST',
      headers: proxyHeaders,
      body: proxyBody,
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Backend error: ${res.status}` },
        { status: res.status >= 400 && res.status < 500 ? res.status : 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      messageId: data.messageId ?? data.message_id,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Telegram service unavailable' },
      { status: 503 },
    );
  }
}
