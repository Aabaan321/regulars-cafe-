/**
 * Turns real coffee footage into the scroll-scrubbed frame sequences that back
 * the Immersive tier.
 *
 * Why frames and not a `<video>`: browsers will not let you seek a video
 * accurately enough to scrub it against scroll. `currentTime = x` decodes to
 * the nearest keyframe, so the picture jumps, stalls, and on iOS refuses to
 * paint at all until the user taps. A decoded still per scroll position is the
 * only way to get motion that tracks the wheel exactly, forwards and back —
 * it is what Apple's product pages do, for the same reason.
 *
 * Every clip is Mixkit stock under the Mixkit Free Stock Video License: free
 * for commercial use, no attribution required, and only redistribution *as
 * stock footage* is forbidden — which is not what a website background is.
 * Each source URL and licence is recorded in the manifest so whoever inherits
 * this repo can see exactly what they are shipping.
 *
 * Run: `npm run pour:frames` (add `--force` to refetch, `-- --only <id>` for
 * one sequence). Uses the `ffmpeg-static` binary, falling back to FFMPEG_PATH
 * or ffmpeg on PATH. This is an asset pipeline, not part of the build: the
 * frames it writes are committed, so a normal `npm install && npm run build`
 * never needs ffmpeg at all.
 */

import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import sharp, { type Sharp } from 'sharp';

const run = promisify(execFile);

/* ── What a sequence is ────────────────────────────────────────────────── */

/**
 * `hero` runs full-bleed behind the home narrative and is the one thing on
 * this site a visitor actually looks *at*; `plate` sits behind a page's own
 * content under a 52–76% veil and is only ever seen through it. Sizing them
 * the same would be paying hero bytes for wallpaper — a plate at 960px under
 * that veil is indistinguishable from one at 1280px, and costs 45% less.
 */
type Role = 'hero' | 'plate';

interface Focus {
  readonly blur: number;
  readonly centreX: string;
  readonly centreY: string;
  readonly radius: string;
  readonly holdTo: string;
}

/**
 * Plates get a tighter, heavier falloff than heroes, for both reasons at
 * once. Visually, a background whose edges have gone should read as a
 * background — it is the difference between footage behind a menu and footage
 * competing with one. Practically, it is where the bytes are: measured on one
 * frame, dropping WebP quality from 54 to 34 saved 24%, while widening the
 * blur from 16 to 26 and pulling the sharp radius in from 62% to 52% saved
 * 25% *without* touching quality — because almost all of a plate's cost is
 * high-frequency detail nobody is looking at.
 */
const FOCUS: Record<Role, Focus> = {
  hero: { blur: 16, centreX: '50%', centreY: '47%', radius: '62%', holdTo: '50%' },
  plate: { blur: 26, centreX: '50%', centreY: '47%', radius: '52%', holdTo: '46%' },
};

interface SequenceSpec {
  readonly id: string;
  readonly videoId: string;
  readonly title: string;
  readonly slug: string;
  readonly role: Role;
  /** The window worth shipping, in seconds. */
  readonly startSeconds: number;
  readonly endSeconds: number;
  /**
   * Stills per second of source.
   *
   * Scaled to how much the clip actually moves, because that is what decides
   * whether consecutive stills read as motion or as a strobe. The surveyed
   * mean adjacent-frame delta for each clip is quoted with it. Fast clips
   * (delta > 12) get 14–18fps; gentle ones (delta < 5) look identical at 9
   * and cost half as much.
   */
  readonly fps: number;
  /** Multiplies brightness and saturation before encoding. 1 = untouched. */
  readonly grade?: { readonly brightness?: number; readonly saturation?: number };
  /**
   * Encoder override, for a clip its role's defaults do not suit.
   *
   * Only one needs it so far, and the reason is worth stating: what a frame
   * costs is set by how much fine structure it contains, not by its size or
   * its quality setting, and an interior full of chairs, railings and people
   * has far more of that than a cup of coffee does.
   */
  readonly encode?: {
    readonly quality?: number;
    readonly focus?: Partial<Focus>;
  };
  readonly note: string;
}

const MIXKIT_LICENCE = 'Mixkit Free Stock Video License (commercial use, no attribution required)';

/**
 * Every scroll-scrubbed sequence on the site: two for the home narrative, one
 * for each page family behind it.
 *
 * Nine clips rather than three because one clip reused everywhere reads as
 * wallpaper within about three pages, and because the windows below are long
 * enough that a visitor scrolling a whole page sees a whole shot rather than
 * the first four seconds of one. Adding another is an entry here and a re-run.
 *
 * Every window was picked from a survey (adjacent-frame delta, drift from the
 * first frame, and mean luminance, sampled at 4fps across each full clip)
 * rather than by eye. Two things disqualify a window: drift that goes flat,
 * which means the picture has stopped changing however much is still moving
 * inside it, and a jump in luminance, which means a hard cut — and a cut
 * halfway through a scrub is the one artefact there is no hiding.
 */
const SEQUENCES: readonly SequenceSpec[] = [
  /* ── The home narrative ──────────────────────────────────────────────── */
  {
    id: 'pour',
    videoId: '3581',
    title: 'Making coffee with whipped cream',
    slug: 'making-coffee-with-whipped-cream-3581',
    role: 'hero',
    /**
     * A latte poured close, from a steel jug into a white cup.
     *
     * This clip was already here; what was wrong was the cut. It ran
     * 0.1–4.0s, which is the *set-up*: the survey shows drift from the first
     * frame climbing to 38 by 2s and then falling back, while the part that
     * was being thrown away — 4s to 9.5s — climbs from 38 to 78 and stays
     * there, at the highest motion in the clip (29 and 37 at 4s and 8s).
     * The shot was being stopped immediately before the thing worth watching.
     */
    startSeconds: 0.1,
    endSeconds: 9.6,
    /** delta 13–37: the fastest clip in the set, so sampled near source rate. */
    fps: 18,
    note: 'The pour, whole: 9.5s where only the first 3.9s used to be shown.',
  },
  {
    id: 'beans',
    videoId: '4985',
    title: 'Coffee beans falling into a coffee pot',
    slug: 'coffee-beans-falling-into-a-coffee-pot-4985',
    role: 'hero',
    /**
     * The cascade — beans leaving the scoop and crossing the frame in the
     * air, slow enough that individual beans read. Drift climbs monotonically
     * 0 → 64 across this window with no cut anywhere, which is as clean a
     * scrub as the survey found; the old 10.4–16.6s cut used the last third
     * of that climb and nothing else.
     */
    startSeconds: 0.4,
    endSeconds: 12.4,
    /** delta 12–18. */
    fps: 14,
    note: 'Three times the old window, and the part where the beans actually leave the scoop.',
  },

  /* ── One plate per page family ───────────────────────────────────────── */
  {
    id: 'bloom',
    videoId: '43941',
    title: 'Pouring coffee in a cup',
    slug: 'pouring-coffee-in-a-cup-43941',
    role: 'plate',
    /**
     * Replaces Mixkit #207 (cream swirling), which was the site-wide default
     * and was the real reason the backgrounds felt short. Its motion decayed
     * from 3.3 to 0.67 and its drift flatlined at 6s of a 9.6s window: the
     * plate visibly *stopped* two-thirds of the way down every page, and no
     * amount of extra frames fixes a clip that has stopped moving.
     *
     * This one holds 1.5–4.9 for a full 15 seconds with drift still climbing
     * at the end, and sits at luma 43–49 — dark enough to carry a page's
     * content without a fight.
     */
    startSeconds: 0.2,
    endSeconds: 15.2,
    /** delta 1.5–4.9: gentle, so 9fps is indistinguishable from 18 and half the bytes. */
    fps: 9,
    note: 'The default plate. Fifteen seconds that never stop moving.',
  },
  {
    id: 'espresso',
    videoId: '3571',
    title: 'Coffee maker serving an espresso',
    slug: 'coffee-maker-serving-an-espresso-3571',
    role: 'plate',
    /** A slow push-in on the group head. Drift rises 0 → 31 without a cut. */
    startSeconds: 0.3,
    endSeconds: 12.2,
    /** delta 1.9–4.2. */
    fps: 10,
    note: 'Behind the menu: extraction, which is what a menu is a list of.',
  },
  {
    id: 'latte',
    videoId: '810',
    title: 'Latte art',
    slug: 'latte-art-810',
    role: 'plate',
    /**
     * Latte art being drawn, the longest source in the set at 34s. The window
     * skips the first four seconds, which are a static set-up, and stops at
     * 17.4s where the motion falls away to 4–6 and stays there.
     *
     * Graded down hard. The master sits at luma 115–128 — it is lit for a
     * bright product shot — and dropped onto the Immersive tier ungraded it
     * glows through the veil like a lightbox. 0.58 brings it to ~72, in line
     * with the rest of the set; the saturation lift puts back the warmth that
     * pulling brightness down takes out.
     */
    startSeconds: 4.0,
    endSeconds: 17.4,
    /** delta 6–19. */
    fps: 11,
    grade: { brightness: 0.58, saturation: 1.12 },
    note: 'Behind ordering: the drink being finished.',
  },
  {
    id: 'cascade',
    videoId: '4982',
    title: 'Coffee beans falling on a layer of more beans',
    slug: 'coffee-beans-falling-on-a-layer-of-more-beans-4982',
    role: 'plate',
    /**
     * Fourteen unbroken seconds of beans falling, at luma 53–62. Unlike the
     * narrative cascade this one does not progress — drift sits flat at ~35
     * from the first second — and for a plate that is the point: a page you
     * can scroll in either direction wants an endless fall, not a shot with
     * a beginning and an end.
     */
    startSeconds: 0.3,
    endSeconds: 14.3,
    /** delta 11–25: the busiest plate, so the densest. */
    fps: 11,
    note: 'Behind the story: where the coffee comes from.',
  },
  {
    id: 'grind',
    videoId: '4984',
    title: 'Coffee powder being poured on the coffee maker filter',
    slug: 'coffee-powder-being-poured-on-the-coffee-maker-filter-4984',
    role: 'plate',
    /** Ground coffee filling a filter. Drift climbs 0 → 53, no cut. */
    startSeconds: 0.3,
    endSeconds: 15.2,
    /** delta 5–13. */
    fps: 9,
    grade: { brightness: 0.86 },
    note: 'Behind the journal: process, at the pace an essay is read.',
  },
  {
    id: 'room',
    videoId: '4350',
    title: 'Urban coffee shop',
    slug: 'urban-coffee-shop-4350',
    role: 'plate',
    /**
     * The only clip here with people in it, and the only one where the window
     * is decided by something other than taste: the source is a montage, and
     * the survey catches its cuts as luminance jumping to 76 at 11s and 74 at
     * 13s. This window stops at 10.6s, just short of the first one.
     */
    startSeconds: 0.3,
    endSeconds: 10.6,
    /** delta 6–10, and a slow pan at that, so it holds up sparsely sampled. */
    fps: 9,
    /**
     * The one clip that needed its own numbers. At the plate defaults it
     * encoded to 16.1KB a frame — more than twice any other plate and more
     * than a *hero* — because it is the only shot here with hard structure
     * in it: chair backs, railings, a dozen people. Pushing the focus
     * falloff from 26/52% to 34/44% and quality from 46 to 38 takes it to
     * 10.5KB with no loss of what the shot is for, which is reading as a
     * busy café from behind a veil.
     */
    encode: { quality: 38, focus: { blur: 34, radius: '44%', holdTo: '38%' } },
    note: 'Behind visiting and events: the room, with people in it.',
  },
  {
    id: 'steam',
    videoId: '43935',
    title: 'Demonstration video of a steaming cup of coffee',
    slug: 'demonstration-video-of-a-steaming-cup-of-coffee-43935',
    role: 'plate',
    /**
     * The darkest clip in the set by some distance (luma 38–39, flat) and the
     * gentlest (delta 1.8–3.0). It goes behind the gallery, where the whole
     * job of the background is to stay out of the way of the photographs.
     */
    startSeconds: 0.2,
    endSeconds: 10.2,
    fps: 10,
    note: 'Behind the gallery: almost nothing, which is what photographs need.',
  },
];

/* ── Variants ──────────────────────────────────────────────────────────── */

interface VariantSpec {
  readonly id: 'wide' | 'tall';
  readonly width: number;
  readonly height: number;
  readonly crop: { left: number; top: number; width: number; height: number } | null;
  readonly quality: number;
}

/**
 * Portrait viewports get a portrait cut, not a 16:9 frame cropped to a sliver
 * at draw time. The crops are centre-biased from the 1920×1080 masters; a few
 * pixels right of centre, because in every one of these clips the subject sits
 * fractionally right of frame.
 */
const VARIANTS: Record<Role, readonly VariantSpec[]> = {
  hero: [
    { id: 'wide', width: 1280, height: 720, crop: null, quality: 60 },
    {
      id: 'tall',
      width: 704,
      height: 940,
      crop: { left: 470, top: 0, width: 810, height: 1080 },
      quality: 62,
    },
  ],
  plate: [
    { id: 'wide', width: 840, height: 472, crop: null, quality: 46 },
    {
      id: 'tall',
      width: 528,
      height: 716,
      crop: { left: 500, top: 0, width: 800, height: 1080 },
      quality: 48,
    },
  ],
};

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

function sourceUrl(spec: SequenceSpec): string {
  return `https://assets.mixkit.co/videos/${spec.videoId}/${spec.videoId}-1080.mp4`;
}

function creditUrl(spec: SequenceSpec): string {
  return `https://mixkit.co/free-stock-video/${spec.slug}/`;
}

function frameCount(spec: SequenceSpec): number {
  return Math.round((spec.endSeconds - spec.startSeconds) * spec.fps);
}

function ffmpeg(): string {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    const require = createRequire(import.meta.url);
    const bundled = require('ffmpeg-static') as string | null;
    if (bundled && existsSync(bundled)) return bundled;
  } catch {
    /* not installed — fall through to PATH */
  }
  return 'ffmpeg';
}

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

async function fetchSource(spec: SequenceSpec): Promise<string> {
  const file = path.join(CACHE_DIR, `${spec.id}-${spec.videoId}.mp4`);
  if (existsSync(file) && !FORCE) {
    console.info(`· ${spec.id}: source cached`);
    return file;
  }
  console.info(`· ${spec.id}: downloading ${sourceUrl(spec)}`);
  const response = await fetch(sourceUrl(spec));
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

  const count = frameCount(spec);
  const span = spec.endSeconds - spec.startSeconds;

  console.info(`· ${spec.id}: extracting ${count} frames (${span.toFixed(1)}s @ ${spec.fps}fps)`);
  await run(
    ffmpeg(),
    [
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
      `fps=${spec.fps}`,
      '-frames:v',
      String(count),
      path.join(rawDir, '%03d.png'),
    ],
    { maxBuffer: 1024 * 1024 * 64 },
  );

  const written = (await readdir(rawDir)).filter((f) => f.endsWith('.png'));
  if (written.length < count) {
    throw new Error(`${spec.id}: ffmpeg produced ${written.length}, expected ${count}`);
  }
  return rawDir;
}

/**
 * A soft radial mask, as an SVG whose alpha runs 1 → 0 from the centre out.
 * Composited with `dest-in` it turns the sharp frame into "sharp in the
 * middle, transparent at the edges", which then sits over the blurred copy.
 */
function focusMask(width: number, height: number, focus: Focus): Buffer {
  return Buffer.from(
    `<svg width="${width}" height="${height}">` +
      `<defs><radialGradient id="f" cx="${focus.centreX}" cy="${focus.centreY}" r="${focus.radius}">` +
      `<stop offset="${focus.holdTo}" stop-color="#fff" stop-opacity="1"/>` +
      `<stop offset="100%" stop-color="#fff" stop-opacity="0"/>` +
      `</radialGradient></defs>` +
      `<rect width="100%" height="100%" fill="url(#f)"/></svg>`,
  );
}

/** Sharp centre over a blurred copy of itself, feathered by `focusMask`. */
async function withFocusFalloff(
  crisp: Buffer,
  width: number,
  height: number,
  focus: Focus,
): Promise<Buffer> {
  const soft = await sharp(crisp).blur(focus.blur).toBuffer();
  const keyed = await sharp(crisp)
    .ensureAlpha()
    .composite([{ input: focusMask(width, height, focus), blend: 'dest-in' }])
    .png()
    .toBuffer();
  return sharp(soft)
    .composite([{ input: keyed, blend: 'over' }])
    .toBuffer();
}

/** Applies a clip's grade, if it has one. Runs before the focus falloff. */
function graded(pipeline: Sharp, spec: SequenceSpec): Sharp {
  if (!spec.grade) return pipeline;
  return pipeline.modulate({
    brightness: spec.grade.brightness ?? 1,
    saturation: spec.grade.saturation ?? 1,
  });
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
  const count = frameCount(spec);
  await mkdir(outDir, { recursive: true });

  const variants: BuiltVariant[] = [];
  const specVariants = VARIANTS[spec.role];
  const focus = { ...FOCUS[spec.role], ...spec.encode?.focus };

  for (const variant of specVariants) {
    const dir = path.join(outDir, variant.id);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    let total = 0;
    for (let i = 0; i < count; i += 1) {
      // ffmpeg numbers from 1; the web sequence is 0-indexed.
      let pipeline = sharp(path.join(rawDir, `${pad(i + 1)}.png`));
      if (variant.crop) pipeline = pipeline.extract(variant.crop);

      const crisp = await graded(
        pipeline.resize(variant.width, variant.height, { fit: 'cover' }),
        spec,
      ).toBuffer();
      const focused = await withFocusFalloff(crisp, variant.width, variant.height, focus);

      const file = path.join(dir, `${pad(i)}.webp`);
      await sharp(focused)
        .webp({
          quality: spec.encode?.quality ?? variant.quality,
          effort: 6,
          smartSubsample: true,
        })
        .toFile(file);
      total += (await stat(file)).size;
    }

    variants.push({ id: variant.id, width: variant.width, height: variant.height, bytes: total });
    console.info(
      `· ${spec.id}/${variant.id}: ${count} frames, ${Math.round(total / 1024)}KB ` +
        `(${(total / count / 1024).toFixed(1)}KB each)`,
    );
  }

  /*
   * The poster is the only part of a sequence on the critical path: it is
   * what paints before a single frame has been fetched, and on a device that
   * asked for reduced motion it is the entire experience. Same grade and same
   * focus falloff as the frames, so the canvas cross-fading over it is
   * invisible.
   */
  const first = path.join(rawDir, '001.png');
  let posterBytes = 0;

  const wideSpec = specVariants.find((v) => v.id === 'wide');
  const tallSpec = specVariants.find((v) => v.id === 'tall');

  if (wideSpec) {
    const buf = await withFocusFalloff(
      await graded(sharp(first).resize(1600, 900, { fit: 'cover' }), spec).toBuffer(),
      1600,
      900,
      focus,
    );
    const file = path.join(outDir, 'poster-wide.webp');
    await sharp(buf).webp({ quality: 74, effort: 6 }).toFile(file);
    posterBytes += (await stat(file)).size;
  }
  if (tallSpec?.crop) {
    const buf = await withFocusFalloff(
      await graded(
        sharp(first).extract(tallSpec.crop).resize(900, 1200, { fit: 'cover' }),
        spec,
      ).toBuffer(),
      900,
      1200,
      focus,
    );
    const file = path.join(outDir, 'poster-tall.webp');
    await sharp(buf).webp({ quality: 72, effort: 6 }).toFile(file);
    posterBytes += (await stat(file)).size;
  }

  const tiny = await graded(sharp(first).resize(20), spec).webp({ quality: 55 }).toBuffer();
  return {
    variants,
    blurDataURL: `data:image/webp;base64,${tiny.toString('base64')}`,
    posterBytes,
  };
}

async function main(): Promise<void> {
  const bin = ffmpeg();
  try {
    await run(bin, ['-version']);
  } catch {
    console.error(
      `✗ ffmpeg not found (tried "${bin}").\n` +
        `  Install it with \`npm i -D ffmpeg-static\`, or set FFMPEG_PATH.\n` +
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
      source: {
        url: sourceUrl(spec),
        title: spec.title,
        credit: `Mixkit — ${creditUrl(spec)}`,
        licence: MIXKIT_LICENCE,
      },
      role: spec.role,
      note: spec.note,
      window: {
        startSeconds: spec.startSeconds,
        endSeconds: spec.endSeconds,
        seconds: Number((spec.endSeconds - spec.startSeconds).toFixed(2)),
        fps: spec.fps,
      },
      frameCount: frameCount(spec),
      basePath: `/immersive/${spec.id}`,
      blurDataURL: built.blurDataURL,
      variants: built.variants,
      posterBytes: built.posterBytes,
    };
    totalBytes += built.variants.reduce((a, v) => a + v.bytes, 0) + built.posterBytes;
  }

  // Anything no longer in SEQUENCES would otherwise linger in the manifest
  // and in public/ forever, and a stale entry is a 404 the moment something
  // routes to it.
  if (!ONLY) {
    const live = new Set(SEQUENCES.map((s) => s.id));
    for (const id of Object.keys(sequences)) {
      if (live.has(id)) continue;
      console.info(`· dropping retired sequence "${id}"`);
      delete sequences[id];
      await rm(path.join(OUT_ROOT, id), { recursive: true, force: true });
    }
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
