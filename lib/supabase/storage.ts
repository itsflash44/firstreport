/**
 * FirstReport — Supabase Storage Helper
 * =======================================
 * Handles PDF upload and signed URL generation.
 * Always use the admin (service role) client here — never the anon client.
 *
 * MANUAL STEP (one-time, in Supabase Dashboard):
 *   Storage → New bucket → Name: "firstReport-documents"
 *   Public: OFF | File size limit: 10 MB | MIME: application/pdf, image/*
 */

import { createAdminClient } from './server';

export const DOCUMENTS_BUCKET = 'firstReport-documents';

/** Upload PDF bytes to Supabase Storage. Returns { path, error }. */
export async function uploadDocument(
  sessionId: string,
  docType: string,
  pdfBytes: Buffer | Uint8Array,
): Promise<{ path: string | null; error: string | null }> {
  try {
    const supabase = createAdminClient();
    const path = `documents/${sessionId}/${docType.toLowerCase()}.pdf`;
    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (error) return { path: null, error: error.message };
    return { path, error: null };
  } catch (err) {
    return { path: null, error: String(err) };
  }
}

/** Create a signed URL valid for 1 hour. */
export async function getSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
