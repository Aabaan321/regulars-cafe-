// No 'server-only' here on purpose: pure HMAC/hash helpers with no request
// context, imported by the seed and cron scripts as well as by the app.
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Opaque, single-purpose tokens for links we email to guests: "manage your
 * booking", "confirm your subscription", "your loyalty card".
 *
 * Shape: <purpose>.<base64url(id)>.<nonce>.<hmac>
 *
 * The HMAC binds the purpose and the id, so a newsletter confirmation link
 * cannot be replayed against the booking endpoint. Only a SHA-256 hash of the
 * token is stored, so a database dump does not let anyone cancel a stranger's
 * table.
 *
 * The id is base64url-encoded rather than interpolated raw. It has to be:
 * the parts are dot-separated and a caller can pass anything — an email
 * address, which contains dots, silently produced a token that could never be
 * parsed back, which meant every manage-booking link in every confirmation
 * email was dead. Encoding removes the whole class of problem.
 */

export type TokenPurpose =
  'manage-booking' | 'confirm-subscription' | 'unsubscribe' | 'loyalty-card' | 'waitlist-offer';

function secret(): string {
  const value = process.env.TOKEN_SECRET ?? process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error('TOKEN_SECRET must be set to at least 32 characters. See .env.example.');
  }
  return value;
}

function sign(purpose: TokenPurpose, encodedId: string, nonce: string): string {
  return createHmac('sha256', secret())
    .update(`${purpose}:${encodedId}:${nonce}`)
    .digest('base64url');
}

/** Ids are encoded so they can never contain the '.' part separator. */
function encodeId(id: string): string {
  return Buffer.from(id, 'utf8').toString('base64url');
}

function decodeId(encoded: string): string {
  return Buffer.from(encoded, 'base64url').toString('utf8');
}

export interface IssuedToken {
  /** Goes in the emailed URL. Never stored. */
  readonly token: string;
  /** Goes in the database column. */
  readonly hash: string;
}

export function issueToken(purpose: TokenPurpose, id: string): IssuedToken {
  const nonce = randomBytes(18).toString('base64url');
  const encoded = encodeId(id);
  const token = `${purpose}.${encoded}.${nonce}.${sign(purpose, encoded, nonce)}`;
  return { token, hash: hashToken(token) };
}

/**
 * A token whose id carries no meaning — used where the row is looked up by
 * hash anyway. Preferred for anything that ends up in a URL, so the link does
 * not carry the guest's email address around in their browser history.
 */
export function issueOpaqueToken(purpose: TokenPurpose): IssuedToken {
  return issueToken(purpose, randomBytes(12).toString('base64url'));
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

  const [purpose, encodedId, nonce, mac] = parts as [string, string, string, string];
  if (purpose !== expected || !encodedId || !nonce || !mac) return null;

  const expectedMac = sign(expected, encodedId, nonce);
  const a = Buffer.from(mac);
  const b = Buffer.from(expectedMac);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return { purpose: expected, id: decodeId(encodedId), hash: hashToken(token) };
}
