import crypto from 'crypto';

const KEY = process.env.ENCRYPTION_KEY!;

/**
 * AES-256-CBC field-level encryption.
 * Used to encrypt rawTranscriptJson before storing in Supabase.
 *
 * Format: iv_hex:ciphertext_hex
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(KEY, 'hex'),
    iv
  );
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt an AES-256-CBC encrypted string.
 * Returns the original plaintext.
 */
export function decrypt(encrypted: string): string {
  const [ivHex, dataHex] = encrypted.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString();
}
