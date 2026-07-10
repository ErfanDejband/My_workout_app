import crypto from 'node:crypto';

// AES-256-GCM encryption for users' AI API tokens (docs/Project/src/structure.md §5.2).
// SERVER ONLY. Never import into client components.
// TOKEN_ENC_KEY must be a 32-byte key provided as hex (64 chars) or base64.

const ALGO = 'aes-256-gcm';

export interface EncryptedToken {
  cipher: string; // base64
  iv: string; // base64
  tag: string; // base64
}

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENC_KEY;
  if (!raw) throw new Error('TOKEN_ENC_KEY is not set');
  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('TOKEN_ENC_KEY must decode to 32 bytes');
  }
  return key;
}

export function encryptToken(plaintext: string): EncryptedToken {
  const iv = crypto.randomBytes(12);
  const cipheriv = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipheriv.update(plaintext, 'utf8'), cipheriv.final()]);
  const tag = cipheriv.getAuthTag();
  return {
    cipher: enc.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64')
  };
}

export function decryptToken(payload: EncryptedToken): string {
  const decipher = crypto.createDecipheriv(
    ALGO,
    getKey(),
    Buffer.from(payload.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(payload.cipher, 'base64')),
    decipher.final()
  ]);
  return dec.toString('utf8');
}
