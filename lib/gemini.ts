/**
 * DEPRECATED — all callers now import from lib/ai.ts
 * This shim adapts the old string-returning API to the new { text, model } API
 * so any missed import still compiles and works correctly.
 */
import { generateContent as _generateContent, generateContentWithImage } from '@/lib/ai';

/** @deprecated import from lib/ai.ts instead */
export async function generateContent(prompt: string): Promise<string> {
  const result = await _generateContent(prompt);
  return result.text;
}

export { generateContentWithImage };
