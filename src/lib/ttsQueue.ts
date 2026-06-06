/**
 * FirstReport — TTS Audio Queue
 * ─────────────────────────────
 * Uses the Web Audio API to schedule sentence-level audio chunks
 * back-to-back with zero gap — enabling "streaming TTS":
 *   • First sentence starts playing ~300 ms after click
 *   • Subsequent sentences are decoded while the first plays
 *   • All chunks are scheduled to start exactly when the previous ends
 *
 * Usage:
 *   const q = new AudioQueue();
 *   q.enqueue(blob1);   // starts playing immediately
 *   q.enqueue(blob2);   // decoded & scheduled while blob1 plays
 *   q.stop();           // hard stop, releases AudioContext
 */

export class AudioQueue {
  private ctx: AudioContext | null = null;
  private nextStartTime = 0;
  private stopped = false;
  private sources: AudioBufferSourceNode[] = [];
  private onEndCallbacks: (() => void)[] = [];
  private enqueuedCount = 0;
  private endedCount = 0;

  // ── Lifecycle ────────────────────────────────────────────────────────

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.nextStartTime = 0;
    }
    return this.ctx;
  }

  // ── Public API ───────────────────────────────────────────────────────

  /**
   * Decode an audio Blob and schedule it to play after whatever is
   * already queued. Resolves once the chunk is scheduled (not when it
   * finishes playing).
   */
  async enqueue(blob: Blob): Promise<void> {
    if (this.stopped) return;

    const ctx = this.getCtx();

    // Wake up a suspended context (browser autoplay policy)
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch { /* ignore */ }
    }

    const arrayBuffer = await blob.arrayBuffer();
    if (this.stopped) return;

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch {
      // Malformed audio — skip this chunk silently
      return;
    }
    if (this.stopped) return;

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now + 0.01, this.nextStartTime);
    source.start(startAt);
    this.nextStartTime = startAt + audioBuffer.duration;
    this.enqueuedCount++;
    const myIndex = this.enqueuedCount;

    // Fire onEnd callbacks only when the LAST enqueued source ends.
    // We capture enqueuedCount at enqueue-time and compare on ended.
    source.onended = () => {
      if (this.stopped) return;
      this.endedCount++;
      if (myIndex === this.enqueuedCount) {
        // This was the last scheduled source — queue fully drained
        this.onEndCallbacks.forEach((cb) => cb());
      }
    };

    this.sources.push(source);
  }

  /** Register a callback to be called when the queue drains naturally. */
  onEnd(cb: () => void): void {
    this.onEndCallbacks.push(cb);
  }

  /** Hard stop — silences everything immediately and releases resources. */
  stop(): void {
    this.stopped = true;
    for (const s of this.sources) {
      try { s.stop(0); } catch { /* may already have ended */ }
      try { s.disconnect(); } catch { /* noop */ }
    }
    this.sources = [];
    if (this.ctx) {
      try { void this.ctx.close(); } catch { /* noop */ }
      this.ctx = null;
    }
    this.nextStartTime = 0;
    this.enqueuedCount = 0;
    this.endedCount = 0;
    this.onEndCallbacks = [];
  }

  /** Reset so the same instance can be reused. */
  reset(): void {
    this.stop();
    this.stopped = false;
  }

  /** True if audio is actively scheduled or playing. */
  get isActive(): boolean {
    return !this.stopped && this.sources.length > 0;
  }
}
