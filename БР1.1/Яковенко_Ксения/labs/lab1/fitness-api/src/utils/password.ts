import crypto from 'crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedPassword: string): boolean {
  const parts = storedPassword.split(':');

  if (parts.length !== 2) {
    return false;
  }

  const [salt, originalHash] = parts;
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(originalHash, 'hex'),
  );
}