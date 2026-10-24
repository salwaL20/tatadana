import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SECRET_KEY = Buffer.from(
  (process.env.ENCRYPTION_KEY || 'tatadana-secret-encryption-key-32chars!!').padEnd(32, '0').slice(0, 32),
  'utf8'
);

/**
 * Encrypts a bot token using AES-256-GCM.
 * Output format: iv_hex:auth_tag_hex:cipher_hex
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an encrypted token.
 * If input is not encrypted (plain text or legacy), returns plain text safely.
 */
export function decryptToken(encryptedText: string): string {
  if (!encryptedText) return '';
  const parts = encryptedText.split(':');
  // Encrypted format has 3 parts: iv, authTag, cipher
  if (parts.length !== 3) {
    return encryptedText;
  }
  const [ivHex, authTagHex, cipherHex] = parts;
  if (ivHex.length !== 32 || authTagHex.length !== 32) {
    return encryptedText;
  }
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // If decryption fails, return as-is
    return encryptedText;
  }
}

/**
 * Masks a Telegram bot token for secure display e.g. "7891234567:AAEx...Dana"
 */
export function maskToken(token: string): string {
  if (!token) return '';
  if (!token.includes(':')) return '***';
  const [botId, secret] = token.split(':');
  if (secret.length <= 8) {
    return `${botId}:****`;
  }
  return `${botId}:${secret.slice(0, 4)}...${secret.slice(-4)}`;
}
