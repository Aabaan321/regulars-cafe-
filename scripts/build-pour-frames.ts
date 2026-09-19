/**
 * Turns a real coffee-pour film into the scroll-scrubbed frame sequence that
 * backs the Immersive narrative.
 *
 * Why frames and not a `<video>`: browsers will not let you seek a video
 * accurately enough to scrub it against scroll. `currentTime = x` decodes to
 * the nearest keyframe, so the picture jumps, stalls, and on iOS refuses to
 * paint at all until the user taps. A decoded still per scroll position is the
 * only way to get a pour that tracks the wheel exactly, forwards and back —
 * it is what Apple's product pages do, for the same reason.
 *
 * The source clip is Mixkit #236, "Filling a white cup of coffee", under the
 * Mixkit Free Stock Video License: free for commercial use, no attribution
 * required, and only redistribution *as stock footage* is forbidden — which is
 * not what a website background is. The licence is recorded in the manifest so
 * whoever inherits this repo can see exactly what they are shipping.
 *
 * Run: `npm run pour:frames` (add `--force` to rebuild from scratch).
 * Needs ffmpeg on PATH, or FFMPEG_PATH pointing at a binary. This is an asset
 * pipeline, not part of the build: the frames it writes are committed, so a
 * normal `npm install && npm run build` never needs ffmpeg at all.
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);

/* ── The cut ───────────────────────────────────────────────────────────── */

const SOURCE = {
  url: 'https://assets.mixkit.co/videos/236/236-1080.mp4',
  title: 'Filling a white cup of coffee',
  credit: 'Mixkit — https://mixkit.co/free-stock-video/filling-a-white-cup-of-coffee-236/',
  licence: 'Mixkit Free Stock Video License (commercial use, no attribution required)',
} as const;

/**
 * Where the interesting 17.6 seconds are.
 *
 * The clip runs 20s. The first second is the stream finding the cup and the
 * last one is a held still; trimming both means every frame we ship is a frame
 * where something is actually changing, which is the whole budget argument for
 * a sequence this size.
 */
const START_SECONDS = 1.2;
const END_SECONDS = 18.8;

/**
 * 72 frames.
 *
 * The pour owns roughly two and a half viewport heights of scroll, so this is
 * about one frame per 30px of wheel travel — past the point where the eye
 * reads it as steps rather than motion. Doubling it would double the bytes to
 * buy nothing.
 */
const FRAME_COUNT = 72;

/**
 * Two crops, and a device only ever downloads one of them.
 *
 * A 16:9 frame `cover`-cropped into a phone's 9:19.5 viewport throws away 70%
 * of its own width — you pay for pixels that are never on screen. The portrait
 * cut is framed on the crema instead, so the phone gets a better picture *and*
 * a third fewer bytes.
 */
const VARIANTS = [
  { id: 'wide', width: 1280, height: 720, crop: null, quality: 70 },
  {
    id: 'tall',
    width: 720,
    height: 960,
    // 810×1080 out of the 1920×1080 master, centred on the cup.
    crop: { left: 555, top: 0, width: 810, height: 1080 },
    quality: 68,
  },
] as const;

/* ── Paths ─────────────────────────────────────────────────────────────── */

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, '.cache', 'pour');
const SOURCE_FILE = path.join(CACHE_DIR, 'source.mp4');
const RAW_DIR = path.join(CACHE_DIR, 'raw');
const OUT_DIR = path.join(ROOT, 'public', 'immersive', 'pour');
const MANIFEST = path.join(ROOT, 'src', 'lib', 'content', 'pour-sequence.json');

const FORCE = process.argv.includes('--force');

function ffmpeg(): string {
  return process.env.FFMPEG_PATH ?? 'ffmpeg';
}

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

async function fetchSource(): Promise<void> {
  if (existsSync(SOURCE_FILE) && !FORCE) {
    console.info('· source clip already cached');
    return;
  }
  console.info(`· downloading ${SOURCE.url}`);
  const response = await fetch(SOURCE.url);
  if (!response.ok) {
    throw new Error(`source clip returned ${response.status} ${response.statusText}`);
  }
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(SOURCE_FILE, Buffer.from(await response.arrayBuffer()));
}

/**
 * Demuxes the chosen window to full-resolution PNG.
 *
 * Lossless on the way out of ffmpeg on purpose: every resize and every WebP
 * decision is made once, by sharp, from the original pixels. Going
 * video → JPEG → WebP would stack two lossy passes and it shows in the crema,
 * which is nothing but fine high-frequency detail.
 */
async function extractFrames(): Promise<void> {
  await rm(RAW_DIR, { recursive: true, force: true });
  await mkdir(RAW_DIR, { recursive: true });

  const span = END_SECONDS - START_SECONDS;
  const fps = FRAME_COUNT / span;

  console.info(`· extracting ${FRAME_COUNT} frames (${span.toFixed(1)}s @ ${fps.toFixed(3)}fps)`);
  await run(ffmpeg(), [
    '-y',
    '-loglevel',
    'error',
    '-ss',
    String(START_SECONDS),
    '-t',
    String(span),
    '-i',
    SOURCE_FILE,
    '-vf',
    `fps=${fps}`,
    '-frames:v',
    String(FRAME_COUNT),
    path.join(RAW_DIR, '%03d.png'),
  ]);

  const written = (await readdir(RAW_DIR)).filter((f) => f.endsWith('.png'));
  if (written.length < FRAME_COUNT) {
    throw new Error(`ffmpeg produced ${written.length} frames, expected ${FRAME_COUNT}`);
  }
}

async function encodeVariants(): Promise<Record<string, number>> {
  const bytes: Record<string, number> = {};

  for (const variant of VARIANTS) {
    const dir = path.join(OUT_DIR, variant.id);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    let total = 0;
    for (let i = 0; i < FRAME_COUNT; i += 1) {
      // ffmpeg numbers from 1; the web sequence is 0-indexed.
      const source = path.join(RAW_DIR, `${pad(i + 1)}.png`);
      let pipeline = sharp(source);
      if (variant.crop) pipeline = pipeline.extract(variant.crop);

      const file = path.join(dir, `${pad(i)}.webp`);
      await pipeline
        .resize(variant.width, variant.height, { fit: 'cover' })
        .webp({ quality: variant.quality, effort: 6, smartSubsample: true })
        .toFile(file);

      total += (await stat(file)).size;
    }

    bytes[variant.id] = total;
    const kb = Math.round(total / 1024);
    console.info(
      `· ${variant.id}: ${FRAME_COUNT} frames, ${kb}KB (${Math.round((total / FRAME_COUNT / 1024) * 10) / 10}KB each)`,
    );
  }

  return bytes;
}

/**
 * The poster, and the blur behind it.
 *
 * This one frame is the only part of the sequence on the critical path: it is
 * what the page paints before a single sequence frame has been fetched, and on
 * a phone that has asked for reduced motion or Save-Data it is the entire
 * experience. So it gets its own higher-quality encode at both aspect ratios.
 */
async function buildPoster(): Promise<{ blurDataURL: string; bytes: number }> {
  const first = path.join(RAW_DIR, '001.png');
  let bytes = 0;

  await sharp(first)
    .resize(1600, 900, { fit: 'cover' })
    .webp({ quality: 78, effort: 6 })
    .toFile(path.join(OUT_DIR, 'poster-wide.webp'));
  bytes += (await stat(path.join(OUT_DIR, 'poster-wide.webp'))).size;

  await sharp(first)
    .extract(VARIANTS[1].crop)
    .resize(900, 1200, { fit: 'cover' })
    .webp({ quality: 76, effort: 6 })
    .toFile(path.join(OUT_DIR, 'poster-tall.webp'));
  bytes += (await stat(path.join(OUT_DIR, 'poster-tall.webp'))).size;

  const tiny = await sharp(first).resize(20).webp({ quality: 55 }).toBuffer();
  return { blurDataURL: `data:image/webp;base64,${tiny.toString('base64')}`, bytes };
}

async function main(): Promise<void> {
  try {
    await run(ffmpeg(), ['-version']);
  } catch {
    console.error(
      `✗ ffmpeg not found. Install it, or set FFMPEG_PATH.\n` +
        `  The committed frames in public/immersive/pour are only rebuilt by this script,\n` +
        `  so nothing else in the project needs ffmpeg.`,
    );
    process.exitCode = 1;
    return;
  }

  await fetchSource();
  await extractFrames();
  await mkdir(OUT_DIR, { recursive: true });
  const bytes = await encodeVariants();
  const poster = await buildPoster();

  const manifest = {
    _comment:
      'Generated by scripts/build-pour-frames.ts — do not edit by hand. Run `npm run pour:frames --force` to rebuild.',
    source: SOURCE,
    window: { startSeconds: START_SECONDS, endSeconds: END_SECONDS },
    frameCount: FRAME_COUNT,
    basePath: '/immersive/pour',
    blurDataURL: poster.blurDataURL,
    variants: VARIANTS.map((v) => ({
      id: v.id,
      width: v.width,
      height: v.height,
      bytes: bytes[v.id] ?? 0,
    })),
    posterBytes: poster.bytes,
  };

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const totalKb = Math.round(
    (Object.values(bytes).reduce((a, b) => a + b, 0) + poster.bytes) / 1024,
  );
  console.info(
    `✓ pour sequence written to public/immersive/pour (${totalKb}KB on disk, one variant per device)`,
  );
}

void main();
