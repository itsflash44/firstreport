/**
 * FirstReport — Global Audio Manager
 *
 * Singleton that tracks ALL playing audio (Sarvam TTS audio elements +
 * Web Speech API utterances) so that route changes can call stopAll()
 * and silence every source at once.
 *
 * Import this in:
 *   - SpeakerButton.tsx  (register each new Audio / utterance)
 *   - app/(app)/layout.tsx  (call stopAll on pathname change)
 */

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

export const audioManager = {
  /** Register an HTMLAudioElement as the currently playing source. */
  setAudio(audio: HTMLAudioElement, objectUrl?: string) {
    this.stopAll();
    currentAudio = audio;
    if (objectUrl) currentObjectUrl = objectUrl;
  },

  /** Stop and clean up everything that's playing right now. */
  stopAll() {
    // Stop HTML Audio
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.src = '';
      } catch {
        /* noop */
      }
      currentAudio = null;
    }
    // Revoke object URL to free memory
    if (currentObjectUrl) {
      try { URL.revokeObjectURL(currentObjectUrl); } catch { /* noop */ }
      currentObjectUrl = null;
    }
    // Stop Web Speech API
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    }
  },

  /** Returns true if anything is currently playing. */
  isPlaying(): boolean {
    return currentAudio !== null && !currentAudio.paused;
  },
};
