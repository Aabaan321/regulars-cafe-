/**
 * Downloads every photograph declared in `src/lib/content/images.ts`,
 * re-encodes it at the declared dimensions, writes it to `public/images/`, and
 * regenerates `src/lib/content/image-blur.json` with a tiny inline blur for
 * each one.
 *
 *   npm run images:fetch          # only missing files
 *   npm run images:fetch -- --all # re-download everything
 *
 * Run this after changing the catalogue, or after replacing the Unsplash
 * placeholders with the client's own photography.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { allImages } from '../src/lib/content/images';

const OUT_DIR = path.join(process.cwd(), 'public', 'images');
const BLUR_FILE = path.join(process.cwd(), 'src', 'lib', 'content', 'image-blur.json');
const FORCE = process.argv.includes('--all');

/** Unsplash's own resizing CDN — we still re-encode locally afterwards. */
function sourceUrl(id: string, width: number, height: number): string {
  return `https://images.unsplash.com/photo-${id}?w=${width}&h=${height}&fit=crop&crop=entropy&q=85&fm=jpg`;
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { 'User-Agent': 'regulars-cafe-demo/1.0' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let blur: Record<string, string> = {};
  if (existsSync(BLUR_FILE)) {
    try {
      blur = JSON.parse(await readFile(BLUR_FILE, 'utf8')) as Record<string, string>;
    } catch {
      blur = {};
    }
  }

  let fetched = 0;
  let skipped = 0;

  for (const image of allImages) {
    const target = path.join(OUT_DIR, `${image.key}.jpg`);
    const needsFile = FORCE || !existsSync(target);
    const needsBlur = FORCE || !blur[image.key];

    if (!needsFile && !needsBlur) {
      skipped += 1;
      continue;
    }

    let buffer: Buffer;
    if (needsFile) {
      process.stdout.write(`  ↓ ${image.key} (${image.width}×${image.height}) `);
      const raw = await download(sourceUrl(image.unsplashId, image.width, image.height));
      buffer = await sharp(raw)
        .resize(image.width, image.height, { fit: 'cover', position: 'attention' })
        .jpeg({ quality: 78, mozjpeg: true, progressive: true })
        .toBuffer();
      await writeFile(target, buffer);
      process.stdout.write(`${(buffer.byteLength / 1024).toFixed(0)}KB\n`);
      fetched += 1;
    } else {
      buffer = await readFile(target);
    }

    // 20px-wide WebP, inlined as a data URL. Big enough to read as the photo,
    // small enough (~300 bytes) that it costs nothing in the document.
    const tiny = await sharp(buffer).resize(20).webp({ quality: 55 }).toBuffer();
    blur[image.key] = `data:image/webp;base64,${tiny.toString('base64')}`;
  }

  const ordered = Object.fromEntries(Object.keys(blur).sort().map((k) => [k, blur[k]]));
  await writeFile(BLUR_FILE, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');

  console.info(`\n✓ ${fetched} downloaded, ${skipped} already present.`);
  console.info(`✓ blur placeholders written to ${path.relative(process.cwd(), BLUR_FILE)}`);
}

main().catch((error: unknown) => {
  console.error('\n✗ image fetch failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
