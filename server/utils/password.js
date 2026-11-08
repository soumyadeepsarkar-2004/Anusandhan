/**
 * Secure Cryptographic Password Hashing Utility
 * Uses asynchronous Node.js crypto scrypt offloaded to libuv threadpool
 * to prevent main event loop starvation during concurrent auth bursts.
 */
import crypto from 'crypto';
import util from 'util';

const scryptAsync = util.promisify(crypto.scrypt);

/**
 * Asynchronously generates a salt and hashes a plaintext password using scrypt.
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} Format: `${salt}:${derivedKeyHex}`
 */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Asynchronously verifies a password against a stored salt:hash string.
 * Validates buffer length before timingSafeEqual to prevent RangeError crashes.
 * @param {string} password - Plaintext password candidate
 * @param {string} storedHash - Stored hash formatted as `${salt}:${derivedKeyHex}`
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) {
      return false;
    }
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = await scryptAsync(password, salt, 64);
    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
