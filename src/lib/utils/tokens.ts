// No 'server-only' here on purpose: pure HMAC/hash helpers with no request
// context, imported by the seed and cron scripts as well as by the app.
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Opaque, single-purpose tokens for links we email to guests: "manage your
 * booking", "confirm your subscription", "your loyalty card".
 *
 * Shape: <purpose>.<id>.<nonce>.<hmac>
 *
 * The HMAC binds the purpose and the row id, so a newsletter confirmation link
 * cannot be replayed against the booking endpoint. Only a SHA-256 hash of the
 * token is stored, so a database dump does not let anyone cancel a stranger's
 * table.
 */

export type TokenPurpose =
  | 'manage-booking'
  | 'confirm-subscription'
  | 'unsubscribe'
  | 'loyalty-card'
  | 'waitlist-offer';

function secret(): string {
  const value = process.env.TOKEN_SECRET ?? process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error('TOKEN_SECRET must be set to at least 32 characters. See .env.example.');
  }
  return value;
}

function sign(purpose: TokenPurpose, id: string, nonce: string): string {
  return createHmac('sha256', secret())
    .update(`${purpose}:${id}:${nonce}`)
    .digest('base64url');
}

export interface IssuedToken {
  /** Goes in the emailed URL. Never stored. */
  readonly token: string;
  /** Goes in the database column. */
  readonly hash: string;
}

export function issueToken(purpose: TokenPurpose, id: string): IssuedToken {
  const nonce = randomBytes(18).toString('base64url');
  const token = `${purpose}.${id}.${nonce}.${sign(purpose, id, nonce)}`;
  return { token, hash: hashToken(token) };
}

/** What gets stored. Deterministic, so lookup is an indexed equality check. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface ParsedToken {
  readonly purpose: TokenPurpose;
  readonly id: string;
  readonly hash: string;
}

/**
 * Verifies the HMAC and returns the embedded id, or null. Callers must still
 * look the hash up: a structurally valid token for a deleted or already-used
 * row must not be honoured.
 */
export function parseToken(token: string, expected: TokenPurpose): ParsedToken | null {
  const parts = token.split('.');
  if (parts.length !== 4) return null;

  const [purpose, id, nonce, mac] = parts as [string, string, string, string];
  if (purpose !== expected || !id || !nonce || !mac) return null;

  const expectedMac = sign(expected, id, nonce);
  const a = Buffer.from(mac);
  const b = Buffer.from(expectedMac);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return { purpose: expected, id, hash: hashToken(token) };
}
