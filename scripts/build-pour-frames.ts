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
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);

/* ── The cut ───────────────────────────────────────────────────────────── */

interface SequenceSpec {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly credit: string;
  readonly licence: string;
  /** The window worth shipping, in seconds. */
  readonly startSeconds: number;
  readonly endSeconds: number;
  /** How many stills to cut it into. */
  readonly frameCount: number;
  readonly variants: readonly VariantSpec[];
}

interface VariantSpec {
  readonly id: 'wide' | 'tall';
  readonly width: number;
  readonly height: number;
  readonly crop: { left: number; top: number; width: number; height: number } | null;
  readonly quality: number;
}

const MIXKIT_LICENCE = 'Mixkit Free Stock Video License (commercial use, no attribution required)';

/**
 * Every scroll-scrubbed sequence on the site.
 *
 * Two of them, because the narrative has two things to say and one shot
 * cannot say both: coffee arriving in a cup, and the beans it was made from
 * falling. Adding a third is an entry here and a re-run.
 */
const SEQUENCES: readonly SequenceSpec[] = [
  {
    id: 'pour',
    url: 'https://assets.mixkit.co/videos/3581/3581-1080.mp4',
    title: 'Making coffee with whipped cream',
    credit: 'Mixkit — https://mixkit.co/free-stock-video/making-coffee-with-whipped-cream-3581/',
    licence: MIXKIT_LICENCE,
    /**
     * A latte being poured, close, from a steel jug into a white cup on a
     * near-black ground.
     *
     * Two earlier cuts were rejected and both for the same reason. A side-on
     * macro had beautiful frames and a level that never moved, so scrubbing
     * it felt like static. A top-down fill had the arc but no impact — the
     * stream met the surface and nothing happened. This one has both: the
     * cup fills visibly *and* the stream visibly hits, swirls and folds the
     * crema under it, which is the moment people actually want to watch.
     *
     * The dark ground is not incidental either. Tier 3 runs dark, and a shot
     * lit against black composites into that page instead of punching a
     * bright rectangle through it.
     */
    startSeconds: 0.1,
    endSeconds: 4.0,
    /**
     * 96 frames across 3.9 seconds is ~24.6fps — essentially the source's own
     * frame rate, so consecutive stills are genuinely consecutive and the
     * motion is as smooth as the footage itself. Sampling below native rate
     * is what made earlier cuts strobe on fast scrolls.
     */
    frameCount: 96,
    variants: [
      { id: 'wide', width: 1280, height: 720, crop: null, quality: 62 },
      {
        id: 'tall',
        width: 720,
        height: 960,
        crop: { left: 470, top: 0, width: 810, height: 1080 },
        quality: 64,
      },
    ],
  },
  {
    id: 'beans',
    url: 'https://assets.mixkit.co/videos/4985/4985-1080.mp4',
    title: 'Coffee beans falling into a coffee pot',
    credit:
      'Mixkit — https://mixkit.co/free-stock-video/coffee-beans-falling-into-a-coffee-pot-4985/',
    licence: MIXKIT_LICENCE,
    /**
     * The cascade. Beans leaving the scoop and crossing the frame in the air,
     * shot slow enough that individual beans read — which is the whole reason
     * this is footage rather than the instanced particle field it replaced.
     * A shader can place a thousand beans; it cannot give you the tumble and
     * the motion blur of one real one.
     */
    startSeconds: 10.4,
    endSeconds: 16.6,
    frameCount: 84,
    variants: [
      { id: 'wide', width: 1280, height: 720, crop: null, quality: 60 },
      {
        id: 'tall',
        width: 720,
        height: 960,
        crop: { left: 480, top: 0, width: 810, height: 1080 },
        quality: 62,
      },
    ],
  },
  {
    id: 'bloom',
    url: 'https://assets.mixkit.co/videos/207/207-1080.mp4',
    title: 'Coffee creamer swirling in coffee',
    credit: 'Mixkit — https://mixkit.co/free-stock-video/coffee-creamer-swirling-in-coffee-207/',
    licence: MIXKIT_LICENCE,
    /**
     * Cream blooming through coffee: caramel plumes, edge to edge, no subject.
     *
     * This is the layer that runs behind *every* Tier 3 page rather than just
     * the home narrative, and it was chosen for what it does not have. There
     * is no cup, no hand and no horizon to fight the text column or to look
     * wrong at an unexpected crop, so it can sit under a menu, a booking form
     * or a journal entry without any of them having to be laid out around it.
     * Abstract is the requirement, not an aesthetic preference.
     */
    startSeconds: 1.4,
    endSeconds: 11.0,
    frameCount: 72,
    variants: [
      { id: 'wide', width: 1152, height: 648, crop: null, quality: 58 },
      {
        id: 'tall',
        width: 648,
        height: 864,
        crop: { left: 555, top: 0, width: 810, height: 1080 },
        quality: 60,
      },
    ],
  },
];

/**
 * Where the lens is focused.
 *
 * The masters are sharp corner to corner, which is not how anyone would light
 * and shoot these, and the out-of-focus background is pure high-frequency
 * detail — the most expensive thing in the frame to encode for the least
 * reason to look at. Falling off to a soft edge is what a fast lens would
 * have done anyway; it pulls the eye to the subject and takes ~28% off every
 * frame. Doing it in the pipeline rather than in CSS saves the bytes on the
 * wire, not just on the screen.
 */
const FOCUS = { blur: 16, centreX: '50%', centreY: '47%', radius: '62%', holdTo: '50%' } as const;

/* ── Paths ─────────────────────────────────────────────────────────────── */

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, '.cache', 'pour');
const OUT_ROOT = path.join(ROOT, 'public', 'immersive');
const MANIFEST = path.join(ROOT, 'src', 'lib', 'content', 'pour-sequence.json');

const FORCE = process.argv.includes('--force');
/** `npm run pour:frames -- --only beans` rebuilds one sequence. */
const ONLY = (() => {
  const at = process.argv.indexOf('--only');
  return at >= 0 ? process.argv[at + 1] : null;
})();

function ffmpeg(): string {
  return process.env.FFMPEG_PATH ?? 'ffmpeg';
}

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

async function fetchSource(spec: SequenceSpec): Promise<string> {
  const file = path.join(CACHE_DIR, `${spec.id}.mp4`);
  if (existsSync(file) && !FORCE) {
    console.info(`· ${spec.id}: source cached`);
    return file;
  }
  console.info(`· ${spec.id}: downloading ${spec.url}`);
  const response = await fetch(spec.url);
  if (!response.ok) {
    throw new Error(`${spec.id}: source returned ${response.status} ${response.statusText}`);
  }
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  return file;
}

/**
 * Demuxes the chosen window to full-resolution PNG.
 *
 * Lossless out of ffmpeg on purpose: every resize and every WebP decision is
 * made once, by sharp, from the original pixels. Going video → JPEG → WebP
 * stacks two lossy passes and it shows in the crema and in the motion blur
 * on a falling bean, which are nothing but fine high-frequency detail.
 */
async function extractFrames(spec: SequenceSpec, source: string): Promise<string> {
  const rawDir = path.join(CACHE_DIR, `${spec.id}-raw`);
  await rm(rawDir, { recursive: true, force: true });
  await mkdir(rawDir, { recursive: true });

  const span = spec.endSeconds - spec.startSeconds;
  const fps = spec.frameCount / span;

  console.info(
    `· ${spec.id}: extracting ${spec.frameCount} frames (${span.toFixed(1)}s @ ${fps.toFixed(3)}fps)`,
  );
  await run(ffmpeg(), [
    '-y',
    '-loglevel',
    'error',
    '-ss',
    String(spec.startSeconds),
    '-t',
    String(span),
    '-i',
    source,
    '-vf',
    `fps=${fps}`,
    '-frames:v',
    String(spec.frameCount),
    path.join(rawDir, '%03d.png'),
  ]);

  const written = (await readdir(rawDir)).filter((f) => f.endsWith('.png'));
  if (written.length < spec.frameCount) {
    throw new Error(`${spec.id}: ffmpeg produced ${written.length}, expected ${spec.frameCount}`);
  }
  return rawDir;
}

/**
 * A soft radial mask, as an SVG whose alpha runs 1 → 0 from the centre out.
 * Composited with `dest-in` it turns the sharp frame into "sharp in the
 * middle, transparent at the edges", which then sits over the blurred copy.
 */
function focusMask(width: number, height: number): Buffer {
  return Buffer.from(
    `<svg width="${width}" height="${height}">` +
      `<defs><radialGradient id="f" cx="${FOCUS.centreX}" cy="${FOCUS.centreY}" r="${FOCUS.radius}">` +
      `<stop offset="${FOCUS.holdTo}" stop-color="#fff" stop-opacity="1"/>` +
      `<stop offset="100%" stop-color="#fff" stop-opacity="0"/>` +
      `</radialGradient></defs>` +
      `<rect width="100%" height="100%" fill="url(#f)"/></svg>`,
  );
}

/** Sharp centre over a blurred copy of itself, feathered by `focusMask`. */
async function withFocusFalloff(crisp: Buffer, width: number, height: number): Promise<Buffer> {
  const soft = await sharp(crisp).blur(FOCUS.blur).toBuffer();
  const keyed = await sharp(crisp)
    .ensureAlpha()
    .composite([{ input: focusMask(width, height), blend: 'dest-in' }])
    .png()
    .toBuffer();
  return sharp(soft)
    .composite([{ input: keyed, blend: 'over' }])
    .toBuffer();
}

interface BuiltVariant {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
}

async function buildSequence(spec: SequenceSpec): Promise<{
  variants: BuiltVariant[];
  blurDataURL: string;
  posterBytes: number;
}> {
  const source = await fetchSource(spec);
  const rawDir = await extractFrames(spec, source);
  const outDir = path.join(OUT_ROOT, spec.id);
  await mkdir(outDir, { recursive: true });

  const variants: BuiltVariant[] = [];

  for (const variant of spec.variants) {
    const dir = path.join(outDir, variant.id);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    let total = 0;
    for (let i = 0; i < spec.frameCount; i += 1) {
      // ffmpeg numbers from 1; the web sequence is 0-indexed.
      let pipeline = sharp(path.join(rawDir, `${pad(i + 1)}.png`));
      if (variant.crop) pipeline = pipeline.extract(variant.crop);

      const crisp = await pipeline
        .resize(variant.width, variant.height, { fit: 'cover' })
        .toBuffer();
      const focused = await withFocusFalloff(crisp, variant.width, variant.height);

      const file = path.join(dir, `${pad(i)}.webp`);
      await sharp(focused)
        .webp({ quality: variant.quality, effort: 6, smartSubsample: true })
        .toFile(file);
      total += (await stat(file)).size;
    }

    variants.push({ id: variant.id, width: variant.width, height: variant.height, bytes: total });
    console.info(
      `· ${spec.id}/${variant.id}: ${spec.frameCount} frames, ${Math.round(total / 1024)}KB ` +
        `(${(total / spec.frameCount / 1024).toFixed(1)}KB each)`,
    );
  }

  /*
   * The poster is the only part of a sequence on the critical path: it is
   * what paints before a single frame has been fetched, and on a device that
   * asked for reduced motion it is the entire experience. Same focus falloff
   * as the frames, so the canvas cross-fading over it is invisible.
   */
  const first = path.join(rawDir, '001.png');
  let posterBytes = 0;

  const wideSpec = spec.variants.find((v) => v.id === 'wide');
  const tallSpec = spec.variants.find((v) => v.id === 'tall');

  if (wideSpec) {
    const buf = await withFocusFalloff(
      await sharp(first).resize(1600, 900, { fit: 'cover' }).toBuffer(),
      1600,
      900,
    );
    const file = path.join(outDir, 'poster-wide.webp');
    await sharp(buf).webp({ quality: 74, effort: 6 }).toFile(file);
    posterBytes += (await stat(file)).size;
  }
  if (tallSpec) {
    const buf = await withFocusFalloff(
      await sharp(first).extract(tallSpec.crop!).resize(900, 1200, { fit: 'cover' }).toBuffer(),
      900,
      1200,
    );
    const file = path.join(outDir, 'poster-tall.webp');
    await sharp(buf).webp({ quality: 72, effort: 6 }).toFile(file);
    posterBytes += (await stat(file)).size;
  }

  const tiny = await sharp(first).resize(20).webp({ quality: 55 }).toBuffer();
  return {
    variants,
    blurDataURL: `data:image/webp;base64,${tiny.toString('base64')}`,
    posterBytes,
  };
}

async function main(): Promise<void> {
  try {
    await run(ffmpeg(), ['-version']);
  } catch {
    console.error(
      `✗ ffmpeg not found. Install it, or set FFMPEG_PATH.\n` +
        `  The committed frames in public/immersive are only rebuilt by this script,\n` +
        `  so nothing else in the project needs ffmpeg.`,
    );
    process.exitCode = 1;
    return;
  }

  const specs = ONLY ? SEQUENCES.filter((s) => s.id === ONLY) : SEQUENCES;
  if (specs.length === 0) {
    console.error(`✗ no sequence named "${ONLY}". Known: ${SEQUENCES.map((s) => s.id).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  // Merge into any existing manifest so `--only` does not drop the others.
  let manifest: Record<string, unknown> = {};
  if (existsSync(MANIFEST)) {
    try {
      manifest = JSON.parse(await readFile(MANIFEST, 'utf8')) as Record<string, unknown>;
    } catch {
      manifest = {};
    }
  }

  const sequences = (manifest.sequences ?? {}) as Record<string, unknown>;
  let totalBytes = 0;

  for (const spec of specs) {
    const built = await buildSequence(spec);
    sequences[spec.id] = {
      source: { url: spec.url, title: spec.title, credit: spec.credit, licence: spec.licence },
      window: { startSeconds: spec.startSeconds, endSeconds: spec.endSeconds },
      frameCount: spec.frameCount,
      basePath: `/immersive/${spec.id}`,
      blurDataURL: built.blurDataURL,
      variants: built.variants,
      posterBytes: built.posterBytes,
    };
    totalBytes += built.variants.reduce((a, v) => a + v.bytes, 0) + built.posterBytes;
  }

  await writeFile(
    MANIFEST,
    `${JSON.stringify(
      {
        _comment:
          'Generated by scripts/build-pour-frames.ts — do not edit by hand. Run `npm run pour:frames` to rebuild, or `-- --only <id>` for one.',
        sequences,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.info(
    `✓ ${specs.length} sequence(s) written (${Math.round(totalBytes / 1024)}KB on disk)`,
  );
}

void main();
