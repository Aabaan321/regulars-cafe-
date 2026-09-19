/**
 * Restores the demo to its seeded state, so the pitch can be run twice.
 *
 *   npm run reset-demo
 *
 * Truncates the transactional tables — bookings, orders, enquiries, emails,
 * analytics — and re-seeds. The schema itself is left alone, so this is
 * seconds rather than a full migration cycle, and it is safe to run between
 * two meetings on the same afternoon.
 *
 * It refuses to run against a database that does not look like the demo,
 * because "reset the demo" and "truncate production" are one typo apart.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import postgres from 'postgres';
import { loadEnv } from './lib/env';

loadEnv();

const url = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('✗ DATABASE_ADMIN_URL (or DATABASE_URL) is not set. See .env.example.');
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

/** Everything the demo writes at runtime. Ordered for readability; the
 *  truncate is a single CASCADE statement so ordering does not matter. */
const TRANSACTIONAL_TABLES = [
  'reservations',
  'waitlist_entries',
  'order_items',
  'orders',
  'enquiries',
  'event_enquiries',
  'subscribers',
  'loyalty_stamps',
  'loyalty_cards',
  'gift_card_transactions',
  'gift_cards',
  'sent_emails',
  'analytics_events',
  'rate_limits',
  'blackout_dates',
  'events',
];

/**
 * Refuses to touch a database that is not the demo.
 *
 * The check is deliberately crude and deliberately loud: the seeded owner
 * account is a fixed address that would never exist in a real café's
 * database, so its presence is good evidence that this is a demo.
 */
async function assertLooksLikeDemo(): Promise<void> {
  if (process.env.ALLOW_DESTRUCTIVE_RESET === 'true') {
    console.warn('  ! ALLOW_DESTRUCTIVE_RESET=true — skipping the safety check.');
    return;
  }

  const [marker] = await sql<{ present: boolean }[]>`
    select exists (
      select 1 from admin_users where email = 'owner@regulars.ae'
    ) as present
  `;

  if (!marker?.present) {
    throw new Error(
      'This database does not contain the demo owner account (owner@regulars.ae), so it ' +
        'does not look like the demo. Refusing to truncate.\n' +
        '  If you are certain, re-run with ALLOW_DESTRUCTIVE_RESET=true.',
    );
  }
}

function runSeed(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'scripts/seed.ts'],
      { stdio: 'inherit', env: process.env },
    );
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`seed exited ${code}`))));
    child.on('error', reject);
  });
}

async function main() {
  console.info('Resetting the demo…\n');
  await assertLooksLikeDemo();

  const started = Date.now();
  // One statement, one transaction: either the demo is cleared or it is not.
  await sql.unsafe(
    `truncate ${TRANSACTIONAL_TABLES.map((t) => `public.${t}`).join(', ')} restart identity cascade`,
  );
  console.info(`  ✓ cleared ${TRANSACTIONAL_TABLES.length} tables in ${Date.now() - started}ms\n`);

  await sql.end({ timeout: 5 });
  await runSeed();
}

main().catch(async (error: unknown) => {
  console.error('\n✗ reset failed:', error instanceof Error ? error.message : error);
  await sql.end({ timeout: 5 }).catch(() => {});
  process.exitCode = 1;
});
