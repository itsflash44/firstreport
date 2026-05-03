/**
 * FirstReport — Offline Sync Queue
 *
 * When sharing fails due to network unavailability, items are queued in
 * localStorage. When the device comes back online, the queue is replayed.
 * Max 3 retries per item, exponential back-off in UI display only.
 */

class OfflineSyncQueue {

  constructor() {
    this._key = 'firstReport_sync_queue';
    this.queue = this._load();
    this._listenOnline();
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */

  /**
   * Add a document sharing job to the queue.
   * @param {string} documentId
   * @param {string} shareMethod  'telegram'|'email'|'whatsapp'|'drive'|'dropbox'|'download'|'text'
   * @param {string|null} target  Email address, phone number, etc.
   * @param {boolean} encrypted
   * @returns {object} The queued item
   */
  enqueue(documentId, shareMethod, target = null, encrypted = false) {
    const item = {
      id:           `sq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      documentId,
      shareMethod,
      target,
      encrypted,
      enqueuedAt:   new Date().toISOString(),
      status:       'pending',   // pending | synced | failed
      retries:      0,
      lastError:    null,
    };
    this.queue.push(item);
    this._save();
    return item;
  }

  /** Attempt to send all pending items now (called on 'online' event). */
  async syncAll() {
    if (!navigator.onLine) return;

    const pending = this.queue.filter(i => i.status === 'pending' && i.retries < 3);
    if (!pending.length) return;

    for (const item of pending) {
      try {
        await this._send(item);
        item.status = 'synced';
        item.lastError = null;
      } catch (err) {
        item.retries++;
        item.lastError = String(err);
        if (item.retries >= 3) item.status = 'failed';
      }
    }
    this._save();
    this._notifyUI();
  }

  /** Get counts for the status indicator. */
  getStatus() {
    return {
      pending: this.queue.filter(i => i.status === 'pending').length,
      synced:  this.queue.filter(i => i.status === 'synced').length,
      failed:  this.queue.filter(i => i.status === 'failed').length,
      total:   this.queue.length,
    };
  }

  /** Remove synced/failed items older than 7 days. */
  prune() {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.queue = this.queue.filter(i =>
      i.status === 'pending' ||
      new Date(i.enqueuedAt).getTime() > cutoff
    );
    this._save();
  }

  /* ── Private ────────────────────────────────────────────────────────────── */

  async _send(item) {
    const res = await fetch('/api/share-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id:  item.documentId,
        share_method: item.shareMethod,
        share_target: item.target,
        encrypted:    item.encrypted,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  _load() {
    try {
      const raw = localStorage.getItem(this._key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem(this._key, JSON.stringify(this.queue));
    } catch {
      /* quota exceeded — ignore */
    }
  }

  _listenOnline() {
    window.addEventListener('online', () => {
      console.log('[FirstReport] Network restored — syncing queue…');
      this.syncAll();
    });
  }

  _notifyUI() {
    // Dispatch custom event so the UI can update the badge
    window.dispatchEvent(new CustomEvent('syncQueueUpdated', { detail: this.getStatus() }));
  }
}

// ── Case History (localStorage-backed) ──────────────────────────────────────

class LocalCaseHistory {

  constructor() {
    this._key = 'firstReport_case_history';
  }

  save(caseData) {
    const all = this.getAll();
    all.unshift({
      id:          `case_${Date.now()}`,
      createdAt:   new Date().toISOString(),
      ...caseData,
    });
    // Keep last 50
    const trimmed = all.slice(0, 50);
    try {
      localStorage.setItem(this._key, JSON.stringify(trimmed));
    } catch { /* ignore */ }
    return trimmed[0];
  }

  getAll() {
    try {
      const raw = localStorage.getItem(this._key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  remove(id) {
    const filtered = this.getAll().filter(c => c.id !== id);
    localStorage.setItem(this._key, JSON.stringify(filtered));
  }
}

// Singletons
const SyncQueue   = new OfflineSyncQueue();
const CaseHistory = new LocalCaseHistory();
