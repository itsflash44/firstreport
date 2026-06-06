/**
 * FirstReport — Global Audio Manager
 *
 * Singleton that tracks ALL playing audio sources so route changes
 * (and the SpeakerButton stop action) can silence everything at once.
 *
 * Supports two source types:
 *   1. HTMLAudioElement  — used by legacy / fallback paths
 *   2. AudioQueue        — used by the streaming sentence-chunked TTS path
 *
 * Import this in:
 *   - SpeakerButton.tsx      (register each new source before playing)
 *   - app/(app)/layout.tsx   (call stopAll on pathname change)
 */

import type { AudioQueue } from '@/lib/ttsQueue';

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
let currentQueue: AudioQueue | null = null;

export const audioManager = {
  /** Register an HTMLAudioElement as the currently playing source. */
  setAudio(audio: HTMLAudioElement, objectUrl?: string) {
    this.stopAll();
    currentAudio = audio;
    if (objectUrl) currentObjectUrl = objectUrl;
  },

  /** Register an AudioQueue as the currently playing source. */
  setQueue(queue: AudioQueue) {
    this.stopAll();
    currentQueue = queue;
  },

  /** Stop and clean up everything that is playing right now. */
  stopAll() {
    // Stop streaming AudioQueue
    if (currentQueue) {
      try { currentQueue.stop(); } catch { /* noop */ }
      currentQueue = null;
    }

    // Stop HTML Audio element
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.src = '';
      } catch { /* noop */ }
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
    if (currentQueue?.isActive) return true;
    return currentAudio !== null && !currentAudio.paused;
  },
};
