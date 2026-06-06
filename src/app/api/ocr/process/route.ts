/**
 * FirstReport — Cloud OCR Fallback Route
 *
 * Used when browser OCR confidence is too low (<40%).
 * Falls back to Google Cloud Vision via Gemini multimodal.
 * This is the SECONDARY path — Tesseract.js is always attempted first.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const GEMINI_KEY = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const documentType = formData.get('documentType') as string ?? 'Unknown';
    const caseName = formData.get('caseName') as string ?? '';

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // ── Gemini Vision OCR ─────────────────────────────────────────
    if (!GEMINI_KEY) {
      return NextResponse.json({
        error: 'Cloud OCR not configured — use browser OCR',
        fallback: true,
      }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/webp';

    const prompt = `You are an OCR specialist for Indian legal documents.

Analyze this ${documentType} image and extract ALL visible text and structured data.

Document context: ${caseName ? `This belongs to case for "${caseName}"` : 'No case context provided'}

Return a JSON object with this exact structure:
{
  "rawText": "all extracted text",
  "confidence": 85,  // 0-100 based on image quality
  "fields": {
    "name": "extracted name or null",
    "aadhaarNumber": "XXXX-XXXX-XXXX masked or null",
    "panNumber": "AAAAA0000A or null",
    "dob": "DD/MM/YYYY or null",
    "gender": "Male/Female/Transgender or null",
    "address": "full address or null",
    "firNumber": "FIR no. or null",
    "policeStation": "station name or null",
    "officerName": "officer name or null",
    "sections": ["BNSS section numbers"],
    "documentNumber": "passport/DL number or null"
  },
  "quality": {
    "isBlurry": false,
    "hasGlare": false,
    "isCropped": false,
    "warnings": ["Hindi warnings about image quality"]
  }
}

IMPORTANT:
- Mask Aadhaar numbers: show only last 4 digits
- For BNSS sections, list actual section numbers found
- Warnings must be in Hindi`;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType, data: base64 } },
    ]);

    const text = result.response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        error: 'Could not parse OCR response',
        rawResponse: text,
      }, { status: 500 });
    }

    const ocrData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      ok: true,
      source: 'gemini-vision',
      ...ocrData,
    });

  } catch (err) {
    console.error('[Cloud OCR] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'OCR failed', fallback: true },
      { status: 500 },
    );
  }
}
