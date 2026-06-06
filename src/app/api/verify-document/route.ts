/**
 * FirstReport — Document Verification API
 * =========================================
 * Accepts an uploaded document image/PDF, runs Gemini vision OCR,
 * and returns structured verification results.
 *
 * RESILIENCE:
 *   - Supabase upload is non-blocking (failure doesn't break verification)
 *   - Prisma save is non-blocking (failure doesn't block result return)
 *   - AI failure returns a graceful partial result, not a 500
 *
 * The response always includes a `document` object so the frontend
 * can render inline verification cards immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithImage } from '@/lib/ai';

/* ── Lazy imports for persistence layers (non-blocking) ──────────────────── */
async function trySupabaseUpload(
  base64Data: string,
  sessionId: string,
  documentType: string,
  mimeType: string,
): Promise<string> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    );
    const buffer      = Buffer.from(base64Data, 'base64');
    const storagePath = `evidence/${sessionId}/${Date.now()}_${documentType.replace(/\s+/g, '_')}.jpg`;
    await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, { contentType: mimeType, upsert: true });
    return supabase.storage.from('documents').getPublicUrl(storagePath).data.publicUrl ?? '';
  } catch (e) {
    console.warn('[VerifyDoc] Supabase upload failed (non-fatal):', e);
    return '';
  }
}

async function tryPrismaCreate(docData: Record<string, unknown>): Promise<string> {
  try {
    const prismaModule = await import('@/lib/prisma');
    const prisma       = prismaModule.default;
    const doc = await (prisma as any).caseDocument.create({ data: docData });
    return doc.id ?? '';
  } catch (e) {
    console.warn('[VerifyDoc] Prisma save failed (non-fatal):', e);
    return '';
  }
}

/* ── OCR prompt — pure JSON output, no prose ─────────────────────────────── */
function buildOcrPrompt(documentType: string, expectedName: string): string {
  return `You are a document OCR and verification specialist for a legal-tech platform.
Analyze this ${documentType} image carefully.
${expectedName ? `The expected name on file is: "${expectedName}"` : ''}

Return ONLY a valid JSON object — no prose, no markdown, no explanation.
Schema:
{
  "verificationScore": <integer 0-100, overall confidence this is a valid authentic document>,
  "blurScore": <integer 0-100, where 100 = perfectly sharp>,
  "qualityScore": <integer 0-100, overall scan/image quality>,
  "extractedName": <string | null, name exactly as printed on document>,
  "extractedIdNumber": <string | null, Aadhaar/PAN/Passport number if visible>,
  "extractedDob": <string | null, date of birth if visible>,
  "extractedAddress": <string | null, address if visible>,
  "status": <one of: "Verified" | "Name Mismatch" | "Needs Better Scan" | "Low Quality" | "Missing Information" | "In Review">,
  "mismatchWarnings": <array of human-readable warning strings>,
  "positiveFields": <array of verified field names, e.g. ["Name readable", "ID number visible", "Photo present"]>
}

Verification rules:
- verificationScore >= 85 → "Verified"
- Name on doc doesn't match expected name → "Name Mismatch" + warning in mismatchWarnings
- blurScore < 40 → "Needs Better Scan" + "Document appears blurry — please retake in better lighting"
- qualityScore < 40 → "Low Quality" + appropriate warning
- Key fields missing (name, ID number for Aadhaar/PAN) → "Missing Information"
- Cannot determine → "In Review"

Output ONLY the JSON object. Do not wrap in markdown.`;
}

/* ── Main handler ─────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  let sessionId = '';
  try {
    const body = await req.json();
    const {
      sessionId:    sid,
      documentType: rawDocType,
      fileBase64,
      mimeType:     rawMime,
      currentCaseName,
    } = body as {
      sessionId:     string;
      documentType:  string;
      fileBase64:    string;
      mimeType:      string;
      currentCaseName?: string;
    };

    sessionId = sid ?? '';

    if (!fileBase64) {
      return NextResponse.json({ error: 'Missing fileBase64' }, { status: 400 });
    }

    const documentType = rawDocType ?? 'Document';
    const mimeType     = rawMime ?? 'image/jpeg';
    const base64Data   = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const expectedName = (currentCaseName ?? '').trim();

    // ── Step 1: Run Gemini Vision OCR ─────────────────────────────────────
    const ocrPrompt  = buildOcrPrompt(documentType, expectedName);
    const rawAiResp  = await generateContentWithImage(ocrPrompt, base64Data, mimeType);

    // ── Step 2: Parse JSON from AI response ───────────────────────────────
    let parsed: Record<string, unknown>;
    try {
      const cleaned = rawAiResp
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('[VerifyDoc] JSON parse failed from AI output:', rawAiResp.slice(0, 200));
      // Return a safe partial result
      parsed = {
        verificationScore: 50,
        blurScore:         50,
        qualityScore:      50,
        extractedName:     null,
        extractedIdNumber: null,
        extractedDob:      null,
        extractedAddress:  null,
        status:            'In Review',
        mismatchWarnings:  ['Document analysis incomplete — please try a clearer scan.'],
        positiveFields:    [],
      };
    }

    // ── Step 3: Build the document result object ──────────────────────────
    const docId  = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now    = new Date().toISOString();

    const document = {
      id:               docId,
      sessionId,
      documentType,
      fileUrl:          '',          // filled after Supabase upload below
      extractedName:    parsed.extractedName    ?? null,
      extractedIdNumber:parsed.extractedIdNumber ?? null,
      extractedDob:     parsed.extractedDob     ?? null,
      extractedAddress: parsed.extractedAddress ?? null,
      verificationScore:Number(parsed.verificationScore ?? 50),
      blurScore:        Number(parsed.blurScore         ?? 50),
      qualityScore:     Number(parsed.qualityScore      ?? 50),
      status:           String(parsed.status            ?? 'In Review'),
      mismatchWarnings: Array.isArray(parsed.mismatchWarnings) ? parsed.mismatchWarnings : [],
      positiveFields:   Array.isArray(parsed.positiveFields)   ? parsed.positiveFields   : [],
      createdAt:        now,
    };

    // ── Step 4: Non-blocking persistence (parallel, results don't block response) ──
    if (sessionId) {
      Promise.all([
        trySupabaseUpload(base64Data, sessionId, documentType, mimeType).then((url) => {
          document.fileUrl = url;
        }),
        tryPrismaCreate({
          sessionId,
          documentType,
          fileUrl:           '',
          extractedText:     '',
          extractedName:     document.extractedName,
          extractedIdNumber: document.extractedIdNumber,
          verificationScore: document.verificationScore,
          blurScore:         document.blurScore,
          qualityScore:      document.qualityScore,
          status:            document.status,
          mismatchWarnings:  document.mismatchWarnings,
        }),
      ]).catch(() => {/* silently ignore */});
    }

    // ── Step 5: Return immediately — don't wait for persistence ──────────
    return NextResponse.json({ success: true, document });

  } catch (error: unknown) {
    console.error('[VerifyDoc] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Verification failed';
    return NextResponse.json(
      {
        success: false,
        error: message,
        document: {
          id:               `doc_${Date.now()}`,
          sessionId,
          documentType:     'Document',
          fileUrl:          '',
          status:           'In Review',
          verificationScore: 0,
          blurScore:         0,
          qualityScore:      0,
          extractedName:     null,
          extractedIdNumber: null,
          mismatchWarnings:  ['Verification service temporarily unavailable. Please try again.'],
          positiveFields:    [],
        },
      },
      { status: 200 }, // Return 200 so frontend can render the error gracefully
    );
  }
}
