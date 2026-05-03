/**
 * FirstReport — Client-side AES-256-GCM Encryption
 * Uses the Web Crypto API (available in all modern browsers, no dependencies).
 *
 * Key derivation: PBKDF2-SHA256, 100,000 iterations.
 * Wire format: [16-byte salt][12-byte nonce][ciphertext+auth-tag]
 */

class ClientEncryption {

  /**
   * Encrypt raw bytes with a user PIN.
   * @param {ArrayBuffer|Uint8Array} data
   * @param {string} pin
   * @returns {Promise<Uint8Array>} salt + nonce + ciphertext
   */
  async encrypt(data, pin) {
    const salt  = crypto.getRandomValues(new Uint8Array(16));
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const key   = await this._deriveKey(pin, salt);

    const input = data instanceof Uint8Array ? data.buffer : data;
    const cipher = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      input
    );

    const out = new Uint8Array(16 + 12 + cipher.byteLength);
    out.set(salt, 0);
    out.set(nonce, 16);
    out.set(new Uint8Array(cipher), 28);
    return out;
  }

  /**
   * Decrypt bytes produced by encrypt().
   * @param {Uint8Array} encrypted
   * @param {string} pin
   * @returns {Promise<Uint8Array>}
   */
  async decrypt(encrypted, pin) {
    const salt  = encrypted.slice(0, 16);
    const nonce = encrypted.slice(16, 28);
    const data  = encrypted.slice(28);
    const key   = await this._deriveKey(pin, salt);

    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      data
    );
    return new Uint8Array(plain);
  }

  /**
   * Encrypt a PDF Blob and return an encrypted Blob.
   * @param {Blob} pdfBlob
   * @param {string} pin
   * @returns {Promise<Blob>}
   */
  async encryptBlob(pdfBlob, pin) {
    const bytes     = await pdfBlob.arrayBuffer();
    const encrypted = await this.encrypt(bytes, pin);
    return new Blob([encrypted], { type: 'application/octet-stream' });
  }

  /**
   * Validate that a PIN can decrypt a previously-encrypted payload
   * (used for PIN confirmation screens).
   * @param {Uint8Array} encrypted
   * @param {string} pin
   * @returns {Promise<boolean>}
   */
  async verifyPin(encrypted, pin) {
    try {
      await this.decrypt(encrypted, pin);
      return true;
    } catch {
      return false;
    }
  }

  /* ── Private helpers ─────────────────────────────────────────────────────── */

  async _deriveKey(pin, salt) {
    const enc  = new TextEncoder();
    const raw  = await crypto.subtle.importKey(
      'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, hash: 'SHA-256', iterations: 100_000 },
      raw,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}

// Singleton
const Encryption = new ClientEncryption();
