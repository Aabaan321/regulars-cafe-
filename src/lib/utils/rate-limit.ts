import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { asService } from '@/lib/db/client';

/**
 * Fixed-window rate limiting, counted in Postgres.
 *
 * A dedicated rate-limit service would be better at scale; for a single-region
 * café site it would be a second thing to run and a second thing to break. The
 * counter is atomic (see `check_rate_limit` in 0002) so concurrent requests
 * cannot both slip under the limit.
 *
 * The identity stored is a salted hash of the client IP, never the IP itself.
 */

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly hits: number;
  readonly retryAfterSeconds: number;
}

export interface RateLimitOptions {
  readonly bucket: string;
  readonly limit: number;
  readonly windowSeconds: number;
  /** Adds a second dimension, e.g. the submitted email address. */
  readonly extraIdentity?: string;
}

/** Best-effort client IP from the proxy chain. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return h.get('x-real-ip') ?? h.get('cf-connecting-ip') ?? 'unknown';
}

function identityHash(parts: readonly string[]): string {
  const salt = process.env.TOKEN_SECRET ?? process.env.AUTH_SECRET ?? 'unsalted';
  return createHash('sha256')
    .update(`${salt}:${parts.join('|')}`)
    .digest('hex')
    .slice(0, 32);
}

export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const ip = await clientIp();
  const identity = identityHash([ip, options.extraIdentity ?? '']);

  try {
    const rows = await asService(
      async (tx) => tx<{ allowed: boolean; hits: number; retry_after_seconds: number }[]>`
        select * from check_rate_limit(
          ${options.bucket}, ${identity}, ${options.limit}, ${options.windowSeconds}
        )
      `,
    );
    const row = rows[0];
    if (!row) return { allowed: true, hits: 0, retryAfterSeconds: 0 };
    return {
      allowed: row.allowed,
      hits: row.hits,
      retryAfterSeconds: row.retry_after_seconds,
    };
  } catch {
    // If the limiter itself is broken, do not take the whole form down with
    // it. Validation, the honeypot and the timing check still apply.
    return { allowed: true, hits: 0, retryAfterSeconds: 0 };
  }
}

/**
 * The bot checks every public form shares.
 *
 * `website` is a honeypot field hidden from humans with CSS and
 * `aria-hidden`; anything filled in is automation. `elapsedMs` is the time
 * between the form rendering and submitting — a human cannot read, think and
 * type in under a second and a half, and a script usually posts instantly.
 */
export interface BotCheckInput {
  readonly honeypot?: string | null;
  readonly renderedAt?: number | null;
  readonly minimumMs?: number;
}

export function looksAutomated({ honeypot, renderedAt, minimumMs = 1500 }: BotCheckInput): boolean {
  if (honeypot && honeypot.trim().length > 0) return true;
  if (typeof renderedAt === 'number' && Number.isFinite(renderedAt)) {
    const elapsed = Date.now() - renderedAt;
    // A negative elapsed time means a forged or clock-skewed timestamp.
    if (elapsed < minimumMs || elapsed < 0) return true;
    // Older than a day: a stale form replayed from a scraped page.
    if (elapsed > 86_400_000) return true;
  }
  return false;
}
