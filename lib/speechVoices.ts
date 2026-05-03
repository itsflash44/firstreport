/**
 * FirstReport — Browser Speech Voice Selection
 *
 * Maps each LangCode to Web Speech API candidate lang tags.
 * Used by SpeakerButton as the offline TTS fallback when Sarvam API
 * is unreachable (no network).
 */

/** BCP-47 candidates to try, in preference order, for each Sarvam LangCode. */
export const SPEECH_VOICE_MAP: Record<string, string[]> = {
  'hi-IN': ['hi-IN', 'hi'],
  'en-IN': ['en-IN', 'en-GB', 'en-US', 'en'],
  'bn-IN': ['bn-IN', 'bn-BD', 'bn'],
  'ta-IN': ['ta-IN', 'ta-LK', 'ta'],
  'te-IN': ['te-IN', 'te'],
  'mr-IN': ['mr-IN', 'mr'],
  'gu-IN': ['gu-IN', 'gu'],
  'kn-IN': ['kn-IN', 'kn'],
  'ml-IN': ['ml-IN', 'ml'],
  'pa-IN': ['pa-IN', 'pa-Guru', 'pa'],
  'od-IN': ['or-IN', 'or'],
};

/**
 * Returns the best available SpeechSynthesisVoice for the given Sarvam
 * language code. Tries each candidate tag in order; falls back to the
 * first available voice if nothing matches.
 *
 * Must be called AFTER voices are loaded (use getVoicesAsync when needed).
 */
export function getBestVoice(sarvamCode: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const candidates = SPEECH_VOICE_MAP[sarvamCode] ?? [sarvamCode, 'en-IN'];

  for (const candidate of candidates) {
    // Exact match first
    const exact = voices.find((v) => v.lang === candidate);
    if (exact) return exact;
    // Prefix match (e.g. "hi" matches "hi-IN")
    const prefix = voices.find((v) => v.lang.startsWith(candidate.split('-')[0]));
    if (prefix) return prefix;
  }

  // Last resort — return whatever is first
  return voices[0] ?? null;
}

/**
 * Waits for voices to be loaded in browsers that load them async
 * (Chrome/Chromium). Resolves immediately if voices are already present.
 */
export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      resolve(window.speechSynthesis.getVoices());
    }, { once: true });
  });
}
