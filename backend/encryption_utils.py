"""
FirstReport — Server-side AES-256-GCM Encryption Utilities
===========================================================
Wire format: [16-byte salt][12-byte nonce][ciphertext + 16-byte GCM tag]
Key derivation: PBKDF2-HMAC-SHA256, 100 000 iterations.

Matches the client-side implementation in frontend/js/encryption.js so that
documents encrypted server-side can be decrypted client-side and vice-versa.
"""

import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


def _derive_key(pin: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,          # 256 bits
        salt=salt,
        iterations=100_000,
    )
    return kdf.derive(pin.encode("utf-8"))


def encrypt_bytes(data: bytes, pin: str) -> bytes:
    """
    Encrypt *data* with *pin*. Returns salt + nonce + ciphertext.
    """
    salt  = os.urandom(16)
    nonce = os.urandom(12)
    key   = _derive_key(pin, salt)
    cipher = AESGCM(key)
    ct    = cipher.encrypt(nonce, data, None)
    return salt + nonce + ct


def decrypt_bytes(payload: bytes, pin: str) -> bytes:
    """
    Decrypt a payload produced by encrypt_bytes().
    Raises ValueError on bad PIN or corrupted data.
    """
    if len(payload) < 28 + 16:  # 16 salt + 12 nonce + 16 GCM tag minimum
        raise ValueError("Payload too short")
    salt      = payload[:16]
    nonce     = payload[16:28]
    ciphertext = payload[28:]
    key       = _derive_key(pin, salt)
    cipher    = AESGCM(key)
    try:
        return cipher.decrypt(nonce, ciphertext, None)
    except Exception as exc:
        raise ValueError("Decryption failed — wrong PIN or corrupted data") from exc
