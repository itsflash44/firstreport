/**
 * FirstReport — Browser TTS engine
 *
 * Why this file exists: many user devices don't ship native voices for
 * Marathi, Odia, Punjabi, Malayalam, or Gujarati. When the Sarvam API is
 * unreachable (Sunita-mode offline), the SpeechSynthesis fallback would
 * silently fail because `utterance.lang = 'mr-IN'` matches nothing on the
 * device. This resolver waits for voices, walks a script-family fallback
 * chain, and tells the caller which voice was actually used.
 *
 * It also applies persona-aware modulation:
 *   - POCSO  → slower + higher pitch (gentle, child-friendly)
 *   - senior → slower + lower pitch (calm, respectful)
 *   - women_dv → slower + normal pitch (trauma-informed)
 *   - advisor → normal rate, slightly clipped (professional)
 *   - standard → neutral
 */

import { LANG_BY_CODE, type LangCode, type PersonaId } from './i18n';

/**
 * Script-family fallback chains. If the device has no voice for the primary
 * language, the resolver tries each language code in order until one matches.
 * Within a code, we also try the bare ISO 639-1 code (e.g. `mr` for `mr-IN`).
 */
const FALLBACK_CHAIN: Record<LangCode, string[]> = {
  // Devanagari script family
  'hi-IN': ['hi-IN', 'hi-Latn-IN', 'hi'],
  'mr-IN': ['mr-IN', 'mr', 'hi-IN', 'hi'],

  // Native English voices are everywhere
  'en-IN': ['en-IN', 'en-GB', 'en-US', 'en'],

  // Bengali / Odia (similar Brahmic root, but fallback to Hindi as last resort)
  'bn-IN': ['bn-IN', 'bn-BD', 'bn', 'hi-IN', 'hi'],
  'od-IN': ['or-IN', 'or', 'bn-IN', 'bn', 'hi-IN', 'hi'],

  // Dravidian
  'ta-IN': ['ta-IN', 'ta-LK', 'ta', 'hi-IN', 'hi'],
  'te-IN': ['te-IN', 'te', 'kn-IN', 'kn', 'hi-IN', 'hi'],
  'kn-IN': ['kn-IN', 'kn', 'te-IN', 'te', 'hi-IN', 'hi'],
  'ml-IN': ['ml-IN', 'ml', 'ta-IN', 'ta', 'hi-IN', 'hi'],

  // Gujarati / Punjabi (own scripts, but Hindi voice gives passable phonetics)
  'gu-IN': ['gu-IN', 'gu', 'hi-IN', 'hi'],
  'pa-IN': ['pa-IN', 'pa', 'pa-Guru-IN', 'hi-IN', 'hi'],
};

/**
 * Persona voice modulation. SpeechSynthesisUtterance.rate is 0.1–10 (default 1).
 * Pitch is 0–2 (default 1). Volume is 0–1 (default 1).
 */
export const PERSONA_VOICE: Record<PersonaId, { rate: number; pitch: number }> = {
  standard: { rate: 1.0,  pitch: 1.0 },
  pocso:    { rate: 0.85, pitch: 1.25 }, // gentle, child-friendly
  women_dv: { rate: 0.9,  pitch: 1.0  }, // calm, trauma-informed
  senior:   { rate: 0.8,  pitch: 0.85 }, // slow, lower (respectful)
  advisor:  { rate: 1.05, pitch: 1.0  }, // professional, slightly brisk
};

/**
 * Wait until the browser has populated the voices list. Some browsers
 * (Chrome) populate asynchronously and `getVoices()` returns [] on first call.
 */
export function waitForVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve([]);
    const synth = window.speechSynthesis;
    const initial = synth.getVoices();
    if (initial.length) return resolve(initial);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(synth.getVoices());
    };

    synth.addEventListener?.('voiceschanged', finish, { once: true });
    setTimeout(finish, timeoutMs); // hard cap
  });
}

/**
 * Pick the best available voice for the requested LangCode, walking the
 * script-family fallback chain. Returns the voice + the actual lang code
 * that matched (so the utterance.lang can be set correctly).
 */
export async function pickVoice(
  lang: LangCode,
): Promise<{ voice: SpeechSynthesisVoice | null; lang: string }> {
  const voices = await waitForVoices();
  if (!voices.length) return { voice: null, lang: LANG_BY_CODE[lang]?.bcp47 ?? lang };

  const chain = FALLBACK_CHAIN[lang] ?? [LANG_BY_CODE[lang]?.bcp47 ?? lang];

  for (const code of chain) {
    // Exact match (case-insensitive)
    const exact = voices.find((v) => v.lang.toLowerCase() === code.toLowerCase());
    if (exact) return { voice: exact, lang: code };
  }

  for (const code of chain) {
    // Prefix match — e.g. requested 'hi' should match a voice tagged 'hi-IN'
    const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(code.toLowerCase()));
    if (prefix) return { voice: prefix, lang: code };
  }

  // Last resort — any English voice (so something speaks instead of silence)
  const english = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
  return { voice: english ?? null, lang: english?.lang ?? 'en-US' };
}

/**
 * Speak text in `lang` with the persona's voice modulation.
 * Returns a function that cancels playback.
 */
export async function speakWithBrowser(
  text: string,
  lang: LangCode,
  persona: PersonaId = 'standard',
  onEnd?: () => void,
): Promise<() => void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return () => {};
  }

  const synth = window.speechSynthesis;
  synth.cancel(); // stop anything currently playing

  const { voice, lang: matchedLang } = await pickVoice(lang);
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = matchedLang;

  const mod = PERSONA_VOICE[persona] ?? PERSONA_VOICE.standard;
  u.rate = mod.rate;
  u.pitch = mod.pitch;

  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();

  // Chrome bug: utterance > 200 chars sometimes truncates. Chunk on sentence
  // boundaries when needed. (For our use-case, opening lines are < 200 chars,
  // so we keep this simple.)
  synth.speak(u);

  return () => {
    synth.cancel();
    onEnd?.();
  };
}
