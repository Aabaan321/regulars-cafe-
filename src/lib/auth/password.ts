// No 'server-only' here on purpose: these are pure functions over node:crypto
// with no request context, and the seed script needs them outside Next.
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/** promisify() drops the options overload, so wrap it with the shape we use. */
function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

/**
 * Password hashing for staff logins.
 *
 * scrypt from Node's own crypto — no native dependency to fail on a client's
 * laptop, and memory-hard in a way PBKDF2 is not. Parameters are stored in the
 * hash string so they can be raised later without invalidating old hashes.
 *
 * Format: scrypt$N$r$p$<salt-b64>$<key-b64>
 */

const N = 16384; // CPU/memory cost
const R = 8; // block size
const P = 1; // parallelisation
const KEY_LEN = 64;
const SALT_LEN = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const key = await scrypt(password.normalize('NFKC'), salt, KEY_LEN, {
    N,
    r: R,
    p: P,
    maxmem: 128 * N * R * 2,
  });
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

/** Constant-time verification. Returns false on any malformed hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const saltB64 = parts[4];
  const keyB64 = parts[5];
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p) || !saltB64 || !keyB64) {
    return false;
  }

  try {
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(keyB64, 'base64');
    const actual = await scrypt(password.normalize('NFKC'), salt, expected.length, {
      N: n,
      r,
      p,
      maxmem: 128 * n * r * 2,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
