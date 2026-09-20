'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { sectionProgress, useImmersive } from '@/components/immersive/scroll-context';
import { FrameSequence } from '@/lib/webgl/frame-sequence';
import { useClientValue } from '@/lib/hooks/use-client-value';
import manifest from '@/lib/content/pour-sequence.json';

/**
 * A filmed sequence, scrubbed against the scroll wheel.
 *
 * Two of these run on the Immersive tier — a coffee pour and a cascade of
 * beans — and both are real footage cut into stills, not simulation. A
 * shader can place a thousand beans; it cannot give you the tumble and the
 * motion blur of one real one, and it certainly cannot fake crema.
 *
 * Three decisions worth defending:
 *
 * **Stills, not `<video>`.** Setting `currentTime` on a video seeks to the
 * nearest keyframe, so a scrubbed video stutters, and iOS will not paint one
 * before a user gesture. A decoded still per scroll position is the only
 * technique that tracks the wheel exactly, forwards and back. It is what
 * Apple's product pages do, for the same reason.
 *
 * **The poster is the only thing on the critical path.** One ~35KB image
 * paints immediately; the frames stream afterwards at low priority, in
 * coarse-to-fine order, and capped by what the device can afford. Nothing
 * about a sequence delays interactivity.
 *
 * **The canvas contains no text.** Every word of every page is
 * server-rendered HTML in front of it. Turn JavaScript off and you get the
 * poster and the full article.
 */

type SequenceId = keyof typeof manifest.sequences;

const sequences = manifest.sequences;

export interface SequenceStageProps {
  readonly sequence: SequenceId;
  readonly dir: 'ltr' | 'rtl';
  /** Global scroll range the frames are scrubbed across. */
  readonly scrub: readonly [number, number];
  /** Global scroll range over which the whole layer fades in and out. */
  readonly fade?: readonly [number, number, number, number];
  /** Slow push-in through the scrub, then drift, as a scale delta. */
  readonly drift?: number;
  readonly priority?: boolean;
  readonly scrim?: 'column' | 'even' | 'none';
}

export function SequenceStage({
  sequence,
  dir,
  scrub,
  fade,
  drift = 0.08,
  priority = false,
  scrim = 'column',
}: SequenceStageProps) {
  const { profile } = useImmersive();
  const spec = sequences[sequence];

  /**
   * Portrait viewports get a portrait cut rather than a 16:9 frame cropped
   * to a sliver. Decided once, before the first fetch: switching variants
   * mid-visit would re-download the sequence to redraw a picture the visitor
   * is already looking at.
   */
  const variant = useClientValue<'wide' | 'tall'>(
    () => (window.innerWidth / window.innerHeight < 0.9 ? 'tall' : 'wide'),
    'wide',
  );

  // Reduced motion and Save-Data get the still. Not a degraded pour — the
  // pour, held, which is a perfectly good photograph and costs one request.
  const still = profile.reducedMotion || profile.saveData;
  // `mounted` is load-bearing: the device profile is a client-only
  // determination, so deciding this branch during hydration rather than after
  // it is a mismatch (React #418) for exactly the visitors who asked for less
  // motion — the worst possible group to ship a hydration error to.
  const mounted = useClientValue(() => true, false);

  return (
    <SequenceLayer fade={fade}>
      <Image
        src={`${spec.basePath}/poster-${variant}.webp`}
        alt=""
        fill
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        sizes="100vw"
        placeholder="blur"
        blurDataURL={spec.blurDataURL}
        className="object-cover"
      />

      {mounted && !still ? (
        <SequenceCanvas
          basePath={spec.basePath}
          frameCount={spec.frameCount}
          variant={variant}
          scrub={scrub}
          drift={drift}
          budget={Math.round(spec.frameCount * profile.frameBudget)}
          label={sequence}
        />
      ) : null}

      {scrim === 'none' ? null : <Scrim dir={dir} variant={variant} even={scrim === 'even'} />}
    </SequenceLayer>
  );
}

/** The fixed, full-bleed box, faded by scroll position. */
function SequenceLayer({
  children,
  fade,
}: {
  children: React.ReactNode;
  fade?: readonly [number, number, number, number];
}) {
  const { progress } = useImmersive();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fade) return;
    const [inStart, inEnd, outStart, outEnd] = fade;
    let frame = 0;
    const tick = (): void => {
      const node = ref.current;
      if (node) {
        const p = progress.current;
        /*
         * A zero-width fade-in window means "already fully in", not "never
         * in". `sectionProgress` returns 0 for an empty range, which silently
         * made the pour — the first thing anyone sees on this page —
         * invisible at scroll 0, because its window was [0, 0].
         */
        const fadedIn = inEnd > inStart ? sectionProgress(p, inStart, inEnd) : 1;
        const alpha = Math.min(fadedIn, 1 - sectionProgress(p, outStart, outEnd));
        node.style.opacity = String(Math.max(0, alpha));
        // Fully transparent layers should not cost a composite.
        node.style.visibility = alpha <= 0.002 ? 'hidden' : 'visible';
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [fade, progress]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={fade ? { opacity: 0, willChange: 'opacity' } : undefined}
    >
      {children}
    </div>
  );
}

/** The scrubbed layer. Mounted only when the visitor is getting motion. */
function SequenceCanvas({
  basePath,
  frameCount,
  variant,
  scrub,
  drift,
  budget,
  label,
}: {
  basePath: string;
  frameCount: number;
  variant: 'wide' | 'tall';
  scrub: readonly [number, number];
  drift: number;
  budget: number;
  label: string;
}) {
  const { progress, setReady } = useImmersive();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrubStart, scrubEnd] = scrub;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    const sequence = new FrameSequence(basePath, variant, frameCount, budget);

    /* ── What has been drawn ───────────────────────────────────────────── */

    let drawnIndex = -1;
    let drawnScale = -1;
    let requested = -1;
    let revealed = false;

    /* ── Backing store ─────────────────────────────────────────────────── */

    const resize = (): void => {
      // Capped at 2 like every other surface here: past that you pay double
      // the fill rate for a difference nobody has ever seen.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      drawnIndex = -1; // force a redraw into the new buffer
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    /* ── Drawing ───────────────────────────────────────────────────────── */

    const paint = (image: HTMLImageElement, index: number, scale: number): void => {
      const width = canvas.width;
      const height = canvas.height;
      const cover = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
      const drawWidth = image.naturalWidth * cover;
      const drawHeight = image.naturalHeight * cover;

      context.drawImage(
        image,
        (width - drawWidth) / 2,
        (height - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );

      drawnIndex = index;
      drawnScale = scale;

      if (!revealed) {
        revealed = true;
        // Cross-fades over the poster it is identical to, so the handover is
        // invisible rather than a flash.
        canvas.style.opacity = '1';
        setReady(true);
      }
    };

    /* ── The loop ──────────────────────────────────────────────────────── */

    let frame = 0;
    const tick = (): void => {
      frame = requestAnimationFrame(tick);
      if (document.hidden) return;

      const global = progress.current;
      const local = sectionProgress(global, scrubStart, scrubEnd);
      const target = Math.min(frameCount - 1, Math.round(local * (frameCount - 1)));

      if (target !== requested) {
        sequence.prioritise(target);
        requested = target;
      }

      // A slow push-in through the shot, then an equally slow drift out, so
      // a held frame never reads as a frozen one.
      const hold = sectionProgress(global, scrubEnd, Math.min(1, scrubEnd + 0.45));
      const scale = 1 + drift - local * drift + hold * (drift * 1.5);

      const pick = sequence.nearest(target);
      if (!pick) return;

      // Redraw only when something moved. A stationary reader costs one ref
      // read per frame and no GPU work at all.
      if (pick.index !== drawnIndex || Math.abs(scale - drawnScale) > 0.0015) {
        paint(pick.image, pick.index, scale);
      }
    };

    /**
     * The fetch waits for the page to be idle.
     *
     * This is the line that keeps Time to Interactive honest: a sequence is
     * megabytes and must not be in flight while the browser is still parsing,
     * hydrating and settling the layout.
     */
    let idle = 0;
    const begin = (): void => {
      sequence.start(({ loaded, total }) => {
        const node = document.getElementById('immersive-debug-frames');
        if (node) node.textContent = `${label} ${loaded}/${total} · ${variant}`;
      });
      frame = requestAnimationFrame(tick);
    };

    if (document.readyState === 'complete') {
      idle = requestIdle(begin);
    } else {
      window.addEventListener(
        'load',
        () => {
          idle = requestIdle(begin);
        },
        { once: true },
      );
    }

    return () => {
      cancelAnimationFrame(frame);
      cancelIdle(idle);
      observer.disconnect();
      sequence.destroy();
    };
  }, [
    basePath,
    frameCount,
    variant,
    budget,
    scrubStart,
    scrubEnd,
    drift,
    label,
    progress,
    setReady,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full opacity-0 transition-opacity duration-500 [transition-timing-function:var(--ease-in-out-soft)]"
    />
  );
}

/**
 * The scrim.
 *
 * Not decoration — contrast. White type over photographed crema is a
 * mid-tone-on-mid-tone problem, and a text-shadow is a fudge rather than a
 * fix: it is not a contrast ratio and WCAG does not count it.
 *
 * The numbers were measured rather than eyeballed. The brightest
 * 99.5th-percentile luminance anywhere under the text column is 0.27 on the
 * wide cut and 0.25 on the tall one, which puts the minimum scrim that clears
 * 4.5:1 against #FFFBF4 at 0.36 and 0.30. These hold a ≥5:1 margin over that
 * and no more — every extra point of black is photography thrown away.
 * Re-measure if a clip is swapped.
 *
 * The shape differs by cut because the problem does. On a wide viewport the
 * column occupies one side, so the scrim falls away over the half of the
 * frame worth looking at. On a phone the column *is* the viewport, so there
 * is no side to fall away to and it runs top to bottom instead.
 */
function Scrim({
  dir,
  variant,
  even,
}: {
  dir: 'ltr' | 'rtl';
  variant: 'wide' | 'tall';
  even: boolean;
}) {
  const side = dir === 'rtl' ? 'left' : 'right';

  const column =
    variant === 'tall' || even
      ? 'linear-gradient(to bottom, rgba(9,6,4,0.70) 0%, rgba(9,6,4,0.46) 24%, ' +
        'rgba(9,6,4,0.44) 66%, rgba(9,6,4,0.78) 100%)'
      : `linear-gradient(to ${side}, rgba(9,6,4,0.68) 0%, rgba(9,6,4,0.60) 30%, ` +
        `rgba(9,6,4,0.48) 50%, rgba(9,6,4,0.22) 74%, rgba(9,6,4,0.04) 100%)`;

  return (
    <>
      <div className="absolute inset-0" style={{ backgroundImage: column }} />
      {variant === 'wide' && !even ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(9,6,4,0.34) 0%, rgba(9,6,4,0.00) 26%, rgba(9,6,4,0.02) 70%, rgba(9,6,4,0.50) 100%)',
          }}
        />
      ) : null}
    </>
  );
}

/* `requestIdleCallback` is still missing on Safari < 17. */
function requestIdle(callback: () => void): number {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(callback, { timeout: 2500 });
  }
  return window.setTimeout(callback, 400);
}

function cancelIdle(handle: number): void {
  if (handle === 0) return;
  if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(handle);
  else window.clearTimeout(handle);
}
