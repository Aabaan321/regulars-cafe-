/**
 * Applies `db/migrations/*.sql` in filename order.
 *
 *   npm run db:migrate           # apply anything not yet applied
 *   npm run db:reset             # drop the public schema and rebuild
 *
 * Runs against DATABASE_ADMIN_URL (an owner/superuser connection) because the
 * migrations create extensions and roles. The application itself connects as
 * the unprivileged `cafe_app` login and never uses this URL.
 *
 * These are plain SQL files against a plain Postgres server. They deliberately
 * create the anon / authenticated / service_role roles that a hosted Postgres
 * platform would provide, so the same files can be pushed to one later without
 * being rewritten — but nothing here depends on such a platform today.
 */

import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import postgres from 'postgres';
import { loadEnv } from './lib/env';

loadEnv();

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');
const FRESH = process.argv.includes('--fresh');

const adminUrl = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
if (!adminUrl) {
  console.error('✗ DATABASE_ADMIN_URL (or DATABASE_URL) is not set. See .env.example.');
  process.exit(1);
}

const sql = postgres(adminUrl, { max: 1, onnotice: () => {} });

async function main() {
  if (FRESH) {
    console.info('⚠ --fresh: dropping and recreating schema public');
    await sql.unsafe(`
      drop schema if exists public cascade;
      create schema public;
      grant all on schema public to public;
    `);
  }

  await sql.unsafe(`
    create table if not exists public.schema_migrations (
      version    text primary key,
      checksum   text not null,
      applied_at timestamptz not null default now()
    );
  `);

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();

  const applied = new Map<string, string>(
    (
      await sql<{ version: string; checksum: string }[]>`
        select version, checksum from public.schema_migrations
      `
    ).map((r) => [r.version, r.checksum]),
  );

  let ran = 0;

  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    const body = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    const checksum = createHash('sha256').update(body).digest('hex').slice(0, 16);
    const previous = applied.get(version);

    if (previous) {
      if (previous !== checksum) {
        console.warn(
          `  ! ${version} has changed since it was applied (${previous} → ${checksum}).\n` +
            '    Migrations are immutable once applied — add a new one, or run npm run db:reset.',
        );
      }
      continue;
    }

    process.stdout.write(`  → ${version} `);
    const started = Date.now();
    // A migration is one transaction: either the whole file lands or none of it.
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`
        insert into public.schema_migrations (version, checksum)
        values (${version}, ${checksum})
      `;
    });
    process.stdout.write(`${Date.now() - started}ms\n`);
    ran += 1;
  }

  await grantAppLoginRoles();

  console.info(ran === 0 ? '✓ database already up to date' : `✓ applied ${ran} migration(s)`);
}

/**
 * The application connects as an unprivileged login and then does
 * `SET LOCAL ROLE anon | authenticated | service_role` on every transaction,
 * which is what makes RLS apply to it. That login therefore has to be a member
 * of those three roles.
 *
 * On a managed platform the superuser role usually already is, making this a
 * no-op. Locally it wires up whichever user DATABASE_URL points at.
 */
async function grantAppLoginRoles(): Promise<void> {
  const appUrl = process.env.DATABASE_URL;
  if (!appUrl || appUrl === adminUrl) return;

  let user: string;
  try {
    user = decodeURIComponent(new URL(appUrl).username);
  } catch {
    return;
  }
  if (!user) return;

  const [exists] = await sql<{ one: number }[]>`
    select 1 as one from pg_roles where rolname = ${user}
  `;
  if (!exists) {
    console.warn(`  ! DATABASE_URL user "${user}" does not exist — skipping role grants.`);
    return;
  }

  // Identifiers cannot be parameterised. The value comes from our own
  // DATABASE_URL, and is additionally constrained to a plain identifier.
  if (!/^[a-z_][a-z0-9_]*$/i.test(user)) {
    console.warn(
      `  ! DATABASE_URL user "${user}" is not a plain identifier — skipping role grants.`,
    );
    return;
  }

  await sql.unsafe(`
    grant anon, authenticated, service_role to "${user}";
    grant usage on schema public to "${user}";
  `);
  console.info(`  ✓ granted anon/authenticated/service_role to "${user}"`);
}

main()
  .catch((error: unknown) => {
    console.error('\n✗ migration failed:', error instanceof Error ? error.message : error);
    if (error && typeof error === 'object' && 'position' in error) {
      console.error('  at character position', (error as { position?: string }).position);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
