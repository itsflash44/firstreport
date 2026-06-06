/**
 * FirstReport — Document Upload API
 *
 * Accepts multipart/form-data document uploads from the OCR pipeline.
 * Stores to Supabase Storage. Falls back gracefully if Supabase is unavailable.
 *
 * Security:
 * - File size limited to 20MB
 * - MIME type validated against allowlist
 * - documentId validated as UUID
 * - No secrets exposed to client
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// 20MB limit for document images
export const maxDuration = 30;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file       = formData.get('file') as File | null;
    const documentId = formData.get('documentId') as string | null;
    const caseId     = formData.get('caseId') as string | null;
    const mimeType   = (formData.get('mimeType') as string | null) ?? file?.type ?? '';

    // ── Validation ────────────────────────────────────────────────
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!documentId || !UUID_RE.test(documentId)) {
      return NextResponse.json({ error: 'Invalid documentId' }, { status: 400 });
    }
    if (!caseId) {
      return NextResponse.json({ error: 'No caseId provided' }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.has(mimeType) && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({
        error: `Unsupported file type: ${mimeType}. Allowed: JPG, PNG, WEBP, PDF`,
      }, { status: 415 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Max: 20MB`,
      }, { status: 413 });
    }

    // ── Supabase Storage Upload ───────────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Offline-only mode: return a local:// URL that the client understands
      return NextResponse.json({
        ok: true,
        url: null,
        mode: 'offline-only',
        message: 'Document stored locally. Will upload when storage is configured.',
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Path: cases/{caseId}/documents/{documentId}/{timestamp}_{filename}
    const ext = file.name.split('.').pop() ?? 'jpg';
    const storagePath = `cases/${caseId}/documents/${documentId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: mimeType || file.type,
        upsert: true,
        duplex: 'half',
      });

    if (uploadError) {
      console.error('[Upload] Supabase storage error:', uploadError.message);
      return NextResponse.json({
        ok: false,
        error: `Storage upload failed: ${uploadError.message}`,
      }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      documentId,
      caseId,
      storagePath,
    });

  } catch (err) {
    console.error('[Upload] Unhandled error:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
