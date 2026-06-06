/**
 * FirstReport — Language support matrix
 *
 * Sarvam AI (verified May 2026) supports STT (`saaras:v3`) and TTS
 * (`bulbul:v3`) for all 11 Indic languages we ship. The bug we hit was
 * that the Python backend silently defaulted to `hi-IN` whenever a request
 * arrived without an explicit `lang_code` field — so Gujarati / Malayalam
 * / Punjabi / Odia mic input was being transcribed as Hindi (producing
 * gibberish), and TTS for those languages was falling back to browser
 * SpeechSynthesis which has no native voices for those scripts on most
 * macOS / Android installs.
 *
 * This matrix is the single source of truth — any provider we add later
 * (e.g. an open-source whisper variant for offline) plugs in here.
 */

import type { LangCode } from './i18n';

export type Provider = 'sarvam' | 'webspeech' | 'unsupported';

export interface LanguageSupport {
  /** STT provider used when the device is online */
  sttPrimary: Provider;
  /** STT fallback when sttPrimary fails */
  sttFallback: Provider;
  /** TTS provider used when the device is online */
  ttsPrimary: Provider;
  /** TTS fallback (script-family voice via `lib/tts.ts`) */
  ttsFallback: Provider;
  /** Sarvam-side language_code (matches saaras:v3 STT + bulbul:v3 TTS) */
  sarvamCode: string;
  /** Browser BCP-47 used by Web Speech API */
  bcp47: string;
}

export const LANGUAGE_SUPPORT: Record<LangCode, LanguageSupport> = {
  'hi-IN': { sttPrimary: 'sarvam', sttFallback: 'webspeech', ttsPrimary: 'sarvam', ttsFallback: 'webspeech', sarvamCode: 'hi-IN', bcp47: 'hi-IN' },
  'en-IN': { sttPrimary: 'sarvam', sttFallback: 'webspeech', ttsPrimary: 'sarvam', ttsFallback: 'webspeech', sarvamCode: 'en-IN', bcp47: 'en-IN' },
  'bn-IN': { sttPrimary: 'sarvam', sttFallback: 'webspeech', ttsPrimary: 'sarvam', ttsFallback: 'webspeech', sarvamCode: 'bn-IN', bcp47: 'bn-IN' },
  'ta-IN': { sttPrimary: 'sarvam', sttFallback: 'webspeech', ttsPrimary: 'sarvam', ttsFallback: 'webspeech', sarvamCode: 'ta-IN', bcp47: 'ta-IN' },
  'te-IN': { sttPrimary: 'sarvam', sttFallback: 'webspeech', ttsPrimary: 'sarvam', ttsFallback: 'webspeech', sarvamCode: 'te-IN', bcp47: 'te-IN' },
  'mr-IN': { sttPrimary: 'sarvam', sttFallback: 'webspeech', ttsPrimary: 'sarvam', ttsFallback: 'webspeech', sarvamCode: 'mr-IN', bcp47: 'mr-IN' },
  'kn-IN': { sttPrimary: 'sarvam', sttFallback: 'webspeech', ttsPrimary: 'sarvam', ttsFallback: 'webspeech', sarvamCode: 'kn-IN', bcp47: 'kn-IN' },
  // The "broken four" — Sarvam supports them server-side, but browsers
  // typically don't ship matching voices, so the webspeech fallback chain
  // (Devanagari / Brahmic family) lives in `lib/tts.ts`.
  'gu-IN': { sttPrimary: 'sarvam', sttFallback: 'webspeech', ttsPrimary: 'sarvam', ttsFallback: 'webspeech', sarvamCode: 'gu-IN', bcp47: 'gu-IN' },
  'ml-IN': { sttPrimary: 'sarvam', sttFallback: 'webspeech', ttsPrimary: 'sarvam', ttsFallback: 'webspeech', sarvamCode: 'ml-IN', bcp47: 'ml-IN' },
  'pa-IN': { sttPrimary: 'sarvam', sttFallback: 'webspeech', ttsPrimary: 'sarvam', ttsFallback: 'webspeech', sarvamCode: 'pa-IN', bcp47: 'pa-IN' },
  'od-IN': { sttPrimary: 'sarvam', sttFallback: 'webspeech', ttsPrimary: 'sarvam', ttsFallback: 'webspeech', sarvamCode: 'od-IN', bcp47: 'or-IN' /* browser ISO uses 'or' */ },
};

export function supportFor(lang: LangCode): LanguageSupport {
  return LANGUAGE_SUPPORT[lang] ?? LANGUAGE_SUPPORT['hi-IN'];
}
