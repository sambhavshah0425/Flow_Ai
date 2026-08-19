import crypto from 'crypto';
import { ENCRYPTION_KEY_HEX } from '../config/security.js';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
  return Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
}

/**
 * Encrypt a plain text string using AES-256-GCM
 */
export function encryptSecret(text) {
  if (!text) return { encryptedData: '', iv: '', tag: '' };
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    tag
  };
}

/**
 * Decrypt an encrypted string using AES-256-GCM
 */
export function decryptSecret(encryptedData, ivHex, tagHex) {
  if (!encryptedData || !ivHex || !tagHex) return '';
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return '';
  }
}
