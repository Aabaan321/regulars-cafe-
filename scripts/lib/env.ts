import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Minimal .env loader for the standalone scripts.
 *
 * Next.js loads .env.local itself for the app; `tsx scripts/*.ts` runs outside
 * Next, so the CLI tools need their own loader. Reads in Next's precedence
 * order and never overwrites a variable already present in the environment
 * (so `DATABASE_URL=... npm run seed` works).
 */
export function loadEnv(): void {
  const files = ['.env', '.env.local', `.env.${process.env.NODE_ENV ?? 'development'}.local`];

  for (const file of files) {
    const full = path.join(process.cwd(), file);
    if (!existsSync(full)) continue;

    for (const rawLine of readFileSync(full, 'utf8').split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const eq = line.indexOf('=');
      if (eq === -1) continue;

      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}
