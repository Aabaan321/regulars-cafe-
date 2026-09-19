import 'server-only';
import postgres, { type Sql, type TransactionSql } from 'postgres';

/**
 * The database connection, and the role discipline that makes RLS real.
 *
 * The app logs in as an unprivileged role that owns nothing and inherits
 * nothing. Every query runs inside a transaction that first does
 * `SET LOCAL ROLE`, so Postgres evaluates the row-level security policies in
 * `db/migrations/0006_rls.sql` for real rather than waving us through as
 * the table owner.
 *
 *   asAnon()      public page reads. Sees published content and nothing else.
 *   asAdmin()     a signed-in staff member; policies check the JWT email.
 *   asService()   server-side writes, after Zod + rate limit + honeypot.
 *
 * There is deliberately no unscoped `sql` export. Picking a role is not
 * optional, because forgetting to pick one is exactly the bug RLS exists to
 * catch.
 */

declare global {
  // Reused across hot reloads in development so we do not leak pools.
  // eslint-disable-next-line no-var
  var __regularsPool: Sql | undefined;
}

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and run `npm run db:migrate`.',
    );
  }
  return url;
}

function createPool(): Sql {
  return postgres(connectionString(), {
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idle_timeout: 20,
    connect_timeout: 10,
    // A transaction-mode connection pooler cannot prepare statements.
    prepare: process.env.DATABASE_DISABLE_PREPARE !== 'true',
    onnotice: () => {},
    transform: { undefined: null },
  });
}

function pool(): Sql {
  if (process.env.NODE_ENV === 'production') {
    globalThis.__regularsPool ??= createPool();
    return globalThis.__regularsPool;
  }
  globalThis.__regularsPool ??= createPool();
  return globalThis.__regularsPool;
}

export type DbRole = 'anon' | 'authenticated' | 'service_role';

export interface JwtClaims {
  readonly role: DbRole;
  readonly email?: string;
  readonly sub?: string;
  readonly admin_role?: string;
}

/**
 * Runs `fn` inside a transaction pinned to `role`, with `claims` exposed to
 * the policies through `request.jwt.claims` under the conventional names.
 */
async function withRole<T>(
  role: DbRole,
  claims: JwtClaims,
  fn: (tx: TransactionSql) => Promise<T>,
): Promise<T> {
  return pool().begin(async (tx) => {
    // `role` is one of three literals from the union above — never user input.
    await tx.unsafe(`set local role ${role}`);
    await tx`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`;
    return fn(tx);
  }) as Promise<T>;
}

/** Public reads. Anything a visitor is not entitled to simply is not there. */
export function asAnon<T>(fn: (tx: TransactionSql) => Promise<T>): Promise<T> {
  return withRole('anon', { role: 'anon' }, fn);
}

/** A signed-in staff member. Policies re-check the email against admin_users. */
export function asAdmin<T>(
  identity: { email: string; id?: string; role?: string },
  fn: (tx: TransactionSql) => Promise<T>,
): Promise<T> {
  return withRole(
    'authenticated',
    {
      role: 'authenticated',
      email: identity.email.toLowerCase(),
      sub: identity.id,
      admin_role: identity.role,
    },
    fn,
  );
}

/**
 * Privileged server-side work: guest writes that have already been validated,
 * rate-limited and honeypot-checked in the route handler, plus scheduled jobs.
 *
 * Never reachable from the browser. If you are reaching for this in a
 * component, you want `asAnon` instead.
 */
export function asService<T>(fn: (tx: TransactionSql) => Promise<T>): Promise<T> {
  return withRole('service_role', { role: 'service_role' }, fn);
}

/** True when a database is configured and reachable. Used by health checks. */
export async function databaseReachable(): Promise<boolean> {
  try {
    await asAnon(async (tx) => tx`select 1`);
    return true;
  } catch {
    return false;
  }
}

export type { TransactionSql };
