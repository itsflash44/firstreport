import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSignedUrl } from '@/lib/supabase/storage';

const DOC_TYPE_MAP: Record<string, string> = {
  sp:      'SP_COMPLAINT',
  dm:      'DM_PETITION',
  hc:      'HC_WRIT',
  officer: 'OFFICER_ACCOUNTABILITY',
  SP_COMPLAINT:           'SP_COMPLAINT',
  DM_PETITION:            'DM_PETITION',
  HC_WRIT:                'HC_WRIT',
  OFFICER_ACCOUNTABILITY: 'OFFICER_ACCOUNTABILITY',
};

/**
 * GET /api/documents/[sessionId]/[docType]
 * Looks up the document entry stored in Session.documentsJson,
 * creates a 1-hour Supabase signed URL, and redirects (302) to it.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string; docType: string } },
) {
  try {
    const docTypeEnum = DOC_TYPE_MAP[params.docType];
    if (!docTypeEnum) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: params.sessionId },
      select: { documentsJson: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const docs = (session.documentsJson as Record<string, { storagePath?: string; storageUrl?: string }> | null) ?? {};
    const doc = docs[docTypeEnum];

    if (!doc?.storagePath && !doc?.storageUrl) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // If we have a direct storageUrl, redirect there; otherwise sign the path
    if (doc.storageUrl) {
      return NextResponse.redirect(doc.storageUrl, 302);
    }

    const signedUrl = await getSignedUrl(doc.storagePath!, 3600);
    if (!signedUrl) {
      return NextResponse.json(
        { error: 'Could not generate download link' },
        { status: 503 },
      );
    }

    return NextResponse.redirect(signedUrl, 302);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}
