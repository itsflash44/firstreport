/**
 * FirstReport — AI Engine
 * ========================
 * Single source of truth for all AI generation.
 * Built for Kaggle Gemma Hackathon — Gemma 3 is the primary model.
 *
 * Priority chain (text):
 *   1. gemma-3-4b-it   via Google AI Studio  ← PRIMARY (hackathon spec)
 *   2. gemini-2.0-flash via Google AI Studio  ← fallback
 *   3. Hardcoded Hindi/English               ← last resort (no crash ever)
 *
 * Priority chain (vision / document OCR):
 *   1. gemini-2.0-flash (vision-capable)
 *   2. Hardcoded safe JSON
 *
 * Env vars required:
 *   GEMINI_API_KEY — Google AI Studio key (free tier covers both Gemma + Gemini)
 */

import { GoogleGenerativeAI, type GenerateContentRequest } from '@google/generative-ai';

// ─── Config ─────────────────────────────────────────────────────────────────

const API_KEY       = process.env.GEMINI_API_KEY ?? '';
const GEMMA_MODEL   = 'gemma-3-4b-it';        // Gemma 3 4B — matches hackathon spec
const GEMINI_MODEL  = 'gemini-2.0-flash';      // Fast, capable fallback

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Singleton client ────────────────────────────────────────────────────────

let _client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!_client) {
    if (!API_KEY) throw new Error('[AI] GEMINI_API_KEY not set');
    _client = new GoogleGenerativeAI(API_KEY);
  }
  return _client;
}

// ─── Text generation ─────────────────────────────────────────────────────────

/**
 * Generate text from a plain-string prompt.
 * Returns { text, model } so callers can label which engine responded.
 */
export async function generateContent(
  prompt: string,
): Promise<{ text: string; model: 'gemma' | 'gemini' | 'mock' }> {

  if (!API_KEY) {
    console.warn('[AI] GEMINI_API_KEY not set — returning offline fallback');
    return { text: getMockResponse(prompt), model: 'mock' };
  }

  // ── Attempt 1: Gemma 3 4B ─────────────────────────────────────────────────
  try {
    const model  = getClient().getGenerativeModel({ model: GEMMA_MODEL });
    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim();
    if (text) {
      console.log(`[AI] ✓ Served by ${GEMMA_MODEL}`);
      return { text, model: 'gemma' };
    }
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status ?? 0;
    if (status === 429) {
      console.warn('[AI] Gemma rate-limited — waiting 3s then retrying…');
      await sleep(3000);
      try {
        const model  = getClient().getGenerativeModel({ model: GEMMA_MODEL });
        const result = await model.generateContent(prompt);
        const text   = result.response.text().trim();
        if (text) return { text, model: 'gemma' };
      } catch { /* fall through */ }
    }
    console.warn(`[AI] Gemma failed (status ${status}) — trying Gemini Flash:`, (err as Error).message);
  }

  // ── Attempt 2: Gemini 2.0 Flash ───────────────────────────────────────────
  try {
    const model  = getClient().getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim();
    if (text) {
      console.log(`[AI] ✓ Served by ${GEMINI_MODEL} (fallback)`);
      return { text, model: 'gemini' };
    }
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status ?? 0;
    if (status === 429) {
      console.warn('[AI] Gemini rate-limited — waiting 3s then retrying…');
      await sleep(3000);
      try {
        const model  = getClient().getGenerativeModel({ model: GEMINI_MODEL });
        const result = await model.generateContent(prompt);
        const text   = result.response.text().trim();
        if (text) return { text, model: 'gemini' };
      } catch { /* fall through */ }
    }
    console.error(`[AI] Gemini Flash also failed (status ${status}):`, (err as Error).message);
  }

  // ── Last resort ───────────────────────────────────────────────────────────
  console.error('[AI] All model attempts failed — returning offline fallback');
  return { text: getMockResponse(prompt), model: 'mock' };
}

// ─── Vision / multimodal generation (OCR, document verification) ─────────────

/**
 * Generate text from prompt + image (base64).
 * Used for police notice board OCR and ID document verification.
 * Always uses Gemini (vision-capable); Gemma 3 4B is vision-capable too but
 * Gemini Flash is more reliable for document OCR.
 */
export async function generateContentWithImage(
  promptText: string,
  imageBase64: string,
  imageMimeType: string = 'image/jpeg',
): Promise<string> {
  if (!API_KEY) {
    return JSON.stringify(visionFallback(['API key not configured — demo mode']));
  }

  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  const request: GenerateContentRequest = {
    contents: [{
      role:  'user',
      parts: [
        { text: promptText },
        { inlineData: { data: base64Data, mimeType: imageMimeType } },
      ],
    }],
  };

  try {
    const model  = getClient().getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(request);
    const text   = result.response.text().trim();
    if (text) return text;
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status ?? 0;
    if (status === 429) {
      await sleep(2000);
      try {
        const model  = getClient().getGenerativeModel({ model: GEMINI_MODEL });
        const result = await model.generateContent(request);
        return result.response.text().trim();
      } catch { /* fall through */ }
    }
    console.error(`[AI Vision] Failed (status ${status}):`, (err as Error).message);
  }

  return JSON.stringify(visionFallback(['Verification service temporarily unavailable. Please retry.']));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Safe offline fallback — never shows a blank or crash state.
 * Detects Hindi from Devanagari codepoint range (U+0900–U+097F).
 */
function getMockResponse(prompt: string): string {
  const isHindi = /[ऀ-ॿ]/.test(prompt);
  return isHindi
    ? 'मैं इस समय AI से जुड़ नहीं पा रहा। कृपया थोड़ी देर बाद कोशिश करें, या NALSA हेल्पलाइन 15100 पर कॉल करें।'
    : 'AI is temporarily unavailable. Please try again shortly, or call NALSA helpline 15100.';
}

function visionFallback(warnings: string[]) {
  return {
    verificationScore: 0,
    blurScore:         0,
    qualityScore:      0,
    extractedName:     null,
    extractedIdNumber: null,
    status:            'In Review',
    mismatchWarnings:  warnings,
  };
}
