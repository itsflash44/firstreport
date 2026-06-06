const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';

/**
 * Sarvam AI STT helper — transcribe audio bytes to text.
 * Model: saaras:v3 (upgraded from deprecated saarika:v2.5)
 */
export async function sarvamSTT(
  audioBlob: Blob,
  language: string = 'hi-IN'
): Promise<{ transcript: string; success: boolean; error?: string }> {
  if (!SARVAM_API_KEY) {
    return { transcript: '', success: false, error: 'SARVAM_API_KEY not set' };
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model', 'saaras:v3');
  formData.append('language_code', language);

  try {
    const res = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': SARVAM_API_KEY },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return { transcript: data.transcript || '', success: true };
    }
    return {
      transcript: '',
      success: false,
      error: `Sarvam API error ${res.status}`,
    };
  } catch {
    return { transcript: '', success: false, error: 'OFFLINE' };
  }
}

/**
 * Default TTS speaker per language for Sarvam bulbul:v3.
 * Each language has its own voice pool — passing a Hindi speaker name
 * ('meera') to a Gujarati/Malayalam/Punjabi/Odia request causes the API
 * to reject the call, producing silence. Omitting the speaker field lets
 * Sarvam pick the correct default for that language.
 */
const SARVAM_SPEAKER: Partial<Record<string, string>> = {
  'hi-IN': 'priya',   // 'meera' is Hindi-only; 'priya' works across all 11 languages
  'en-IN': 'ishita',  // consistent with backend/extended_routes.py
  // All other languages (gu-IN, ml-IN, pa-IN, od-IN, bn-IN, ta-IN, te-IN,
  // mr-IN, kn-IN) intentionally omitted — Sarvam picks the right default.
};

/**
 * Sarvam AI TTS helper — convert text to speech audio.
 * Model: bulbul:v3
 * Returns audio bytes as ArrayBuffer.
 */
export async function sarvamTTS(
  text: string,
  language: string = 'hi-IN'
): Promise<{ audio: ArrayBuffer | null; success: boolean; error?: string }> {
  if (!SARVAM_API_KEY) {
    return { audio: null, success: false, error: 'SARVAM_API_KEY not set' };
  }

  const speaker = SARVAM_SPEAKER[language];
  const requestBody: Record<string, unknown> = {
    inputs: [text],
    target_language_code: language,
    model: 'bulbul:v3',
  };
  // Only include speaker when we know the correct name for the language.
  // Sending an invalid speaker causes Sarvam to reject the request.
  if (speaker) requestBody.speaker = speaker;

  try {
    const res = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (res.ok) {
      const data = await res.json();
      // Sarvam returns base64 encoded audio
      if (data.audios && data.audios[0]) {
        const binaryString = atob(data.audios[0]);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return { audio: bytes.buffer, success: true };
      }
    }
    return { audio: null, success: false, error: `TTS error ${res.status}` };
  } catch {
    return { audio: null, success: false, error: 'OFFLINE' };
  }
}
