/**
 * FirstReport — Voice Manager (TTS + STT + Microphone)
 *
 * TTS flow:  /api/tts-proxy (Python backend → Sarvam bulbul:v3, speaker: priya)
 *            → Web Speech API fallback (offline / unsupported language)
 *
 * STT flow:  MediaRecorder → /api/transcribe (Python backend → Sarvam saaras:v3)
 *            → null returned, UI shows text fallback field
 *
 * Speaker: 'priya' — female voice, performs well across all 11 Indian languages.
 * Model:  'saaras:v3' (upgraded from deprecated saarika:v2.5).
 */

const BACKEND_URL = window.FIRST_REPORT_BACKEND || 'http://localhost:8000';

class VoiceManager {

  constructor() {
    this.language    = 'hi-IN';  // BCP-47 code, e.g. hi-IN
    this._recorder   = null;
    this._stream     = null;
    this._chunks     = [];
    this._speaking   = false;
    this._currentAudio = null;
  }

  /** Set the active language (BCP-47 code). */
  setLanguage(code) {
    this.language = code;
  }

  /* ── TTS ─────────────────────────────────────────────────────────────────── */

  /**
   * Speak text aloud.
   * Tries Sarvam TTS first; falls back to Web Speech API.
   * @param {string} text
   * @param {string|null} langOverride
   */
  async speak(text, langOverride = null) {
    if (!text || !text.trim()) return;

    const lang = langOverride || this.language;
    this.stop();

    try {
      await this._speakViaSarvam(text, lang);
    } catch (err) {
      console.warn('[VoiceManager] Sarvam TTS failed:', err.message, '— falling back to Web Speech API');
      this._speakViaWebSpeech(text, lang);
    }
  }

  /** Stop any currently playing audio. */
  stop() {
    if (this._currentAudio) {
      this._currentAudio.pause();
      this._currentAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this._speaking = false;
  }

  /* ── STT ─────────────────────────────────────────────────────────────────── */

  /**
   * Start recording from the microphone.
   * @returns {Promise<void>}
   */
  async startRecording() {
    if (this._recorder && this._recorder.state !== 'inactive') return;

    this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this._chunks = [];

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4';

    this._recorder = new MediaRecorder(this._stream, { mimeType });
    this._recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this._chunks.push(e.data);
    };
    this._recorder.start(100); // collect every 100ms
  }

  /**
   * Stop recording and return the audio Blob.
   * Mic tracks are released immediately (before any API call).
   * @returns {Promise<Blob>}
   */
  async stopRecording() {
    return new Promise((resolve) => {
      this._recorder.onstop = () => {
        const blob = new Blob(this._chunks, { type: this._recorder.mimeType });

        // Release mic immediately — macOS indicator goes dark right away
        if (this._stream) {
          this._stream.getTracks().forEach(t => t.stop());
          this._stream = null;
        }
        this._chunks = [];
        resolve(blob);
      };
      this._recorder.stop();
    });
  }

  /** True while recorder is active. */
  get isRecording() {
    return !!(this._recorder && this._recorder.state === 'recording');
  }

  /**
   * Transcribe an audio Blob via the Python backend → Sarvam saaras:v3.
   * @param {Blob} audioBlob
   * @returns {Promise<string|null>} Transcript or null on failure.
   */
  async transcribe(audioBlob) {
    const form = new FormData();
    form.append('audio',     audioBlob, 'recording.webm');
    form.append('lang_code', this.language);

    try {
      const res  = await fetch(`${BACKEND_URL}/api/transcribe`, { method: 'POST', body: form });
      const data = await res.json();
      return data.transcript || null;
    } catch (err) {
      console.warn('[VoiceManager] STT failed:', err.message);
      return null;
    }
  }

  /* ── Private ─────────────────────────────────────────────────────────────── */

  async _speakViaSarvam(text, lang) {
    const res = await fetch(`${BACKEND_URL}/api/tts-proxy`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text, language: lang }),
    });

    if (!res.ok) throw new Error(`TTS proxy ${res.status}`);

    const audioBlob = await res.blob();
    const url       = URL.createObjectURL(audioBlob);
    const audio     = new Audio(url);

    this._currentAudio = audio;
    this._speaking     = true;

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        this._speaking     = false;
        this._currentAudio = null;
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        this._speaking     = false;
        this._currentAudio = null;
        reject(new Error('Audio playback error'));
      };
      audio.play().catch(reject);
    });
  }

  _speakViaWebSpeech(text, lang) {
    if (!window.speechSynthesis) return;

    const u  = new SpeechSynthesisUtterance(text);
    u.lang   = lang;
    u.rate   = 0.9;
    u.pitch  = 1.0;

    // Try to pick a matching voice
    const voices = window.speechSynthesis.getVoices();
    const match  = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (match) u.voice = match;

    u.onend   = () => { this._speaking = false; };
    u.onerror = () => { this._speaking = false; };

    this._speaking = true;
    window.speechSynthesis.speak(u);
  }
}

// ── Haptic helper ────────────────────────────────────────────────────────────

/**
 * Trigger device vibration if supported.
 * @param {'light'|'medium'|'heavy'} strength
 */
function triggerHaptic(strength = 'light') {
  if (!navigator.vibrate) return;
  const patterns = { light: 10, medium: 25, heavy: 60 };
  navigator.vibrate(patterns[strength] || 10);
}

// Singleton
const Voice = new VoiceManager();
