'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { sectionProgress, useImmersive } from '@/components/immersive/scroll-context';
import { FrameSequence } from '@/lib/webgl/frame-sequence';
import { useClientValue } from '@/lib/hooks/use-client-value';
import pourManifest from '@/lib/content/pour-sequence.json';

/**
 * THE POUR.
 *
 * A real coffee-pour, filmed, cut into 72 stills, and scrubbed against the
 * scroll wheel: forwards as you read down, backwards as you read up, at
 * exactly the speed of your hand. Nothing here is simulated — the crema, the
 * way the stream breaks into droplets as it stops, the bubbles that keep
 * drifting after the pour ends are all photographed.
 *
 * Three decisions worth defending:
 *
 * **Stills, not `<video>`.** Setting `currentTime` on a video seeks to the
 * nearest keyframe, so a scrubbed video stutters, and iOS will not paint one
 * at all before a user gesture. A decoded still per scroll position is the
 * only technique that actually tracks the wheel. It is what Apple's product
 * pages do.
 *
 * **The poster is the only thing on the critical path.** One 40KB image paints
 * the hero immediately; the 72 frames stream in afterwards at low priority and
 * in coarse-to-fine order, so the pour animates within a second or two and
 * simply gets smoother. Nothing about the sequence delays interactivity, which
 * is the performance budget the brief sets.
 *
 * **It draws to a canvas, and the canvas contains no text.** Every word of
 * this page is server-rendered HTML sitting in front of it. Turn JavaScript
 * off and you get the poster and the full article.
 */

/** Global scroll range the pour is scrubbed across — chapters one and two. */
const POUR_START = 0.015;
const POUR_END = 0.4;

const { frameCount, basePath, blurDataURL } = pourManifest;

export function PourStage({ dir }: { dir: 'ltr' | 'rtl' }) {
  const { profile } = useImmersive();

  /**
   * Portrait viewports get a portrait cut of the film rather than a 16:9 frame
   * cropped down to a sliver. Decided once, before the first fetch: switching
   * variants mid-visit would re-download the whole sequence to redraw a
   * picture the visitor is already looking at.
   */
  const variant = useClientValue<'wide' | 'tall'>(
    () => (window.innerWidth / window.innerHeight < 0.9 ? 'tall' : 'wide'),
    'wide',
  );

  // A visitor who asked for reduced motion, or who is on Save-Data, gets the
  // still. Not a degraded version of the pour — the pour, held, which is a
  // perfectly good photograph and costs one request.
  //
  // `mounted` is load-bearing, not belt-and-braces: the device profile is a
  // client-only determination, so the server renders this branch not knowing
  // the answer. Deciding during hydration instead of after it is a
  // server/client mismatch (React #418) for exactly the visitors who asked
  // for less motion — which is the worst possible group to ship a hydration
  // error to.
  const mounted = useClientValue(() => true, false);
  const still = profile.reducedMotion || profile.saveData;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Image
        src={`${basePath}/poster-${variant}.webp`}
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        blurDataURL={blurDataURL}
        className="object-cover"
      />

      {mounted && !still ? <PourCanvas variant={variant} /> : null}

      <Scrim dir={dir} variant={variant} />
    </div>
  );
}

/** The scrubbed layer. Mounted only when the visitor is getting motion. */
function PourCanvas({ variant }: { variant: 'wide' | 'tall' }) {
  const { progress, setReady } = useImmersive();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    const sequence = new FrameSequence(basePath, variant, frameCount);

    /* ── What has been drawn ───────────────────────────────────────────── */

    let drawnIndex = -1;
    let drawnScale = -1;
    let requested = -1;
    let revealed = false;

    /* ── Backing store ─────────────────────────────────────────────────── */

    const resize = (): void => {
      // Capped at 2 like every other surface on this page: past that you pay
      // double the fill rate for a difference nobody has ever seen.
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
      const local = sectionProgress(global, POUR_START, POUR_END);
      const target = Math.min(frameCount - 1, Math.round(local * (frameCount - 1)));

      if (target !== requested) {
        sequence.prioritise(target);
        requested = target;
      }

      // A slow push-in through the pour, then an equally slow drift out
      // across the chapters that follow, so a held frame never reads as a
      // frozen one.
      const hold = sectionProgress(global, POUR_END, 0.85);
      const scale = 1.06 - local * 0.06 + hold * 0.09;

      const pick = sequence.nearest(target);
      if (!pick) return;

      // Redraw only when something actually moved. A stationary reader costs
      // one ref read per frame and no GPU work at all.
      if (pick.index !== drawnIndex || Math.abs(scale - drawnScale) > 0.0015) {
        paint(pick.image, pick.index, scale);
      }
    };

    /**
     * The fetch waits for the page to be idle.
     *
     * This is the line that keeps Time to Interactive honest: the sequence is
     * ~1.6MB and it must not be in flight while the browser is still parsing,
     * hydrating, and settling the layout.
     */
    let idle = 0;
    const begin = (): void => {
      sequence.start(({ loaded, total }) => {
        // ?debug=1 only. Written straight to the DOM so watching the sequence
        // arrive does not itself cause sixty re-renders.
        const node = document.getElementById('immersive-debug-frames');
        if (node) node.textContent = `${loaded}/${total} frames · ${variant}`;
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
  }, [variant, progress, setReady]);

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
 * So the darkening is shaped to the text column, and the numbers were
 * measured rather than eyeballed: the brightest 99.5th-percentile luminance
 * anywhere under the column is 0.27 on the wide cut and 0.25 on the tall one,
 * which puts the minimum scrim that clears 4.5:1 against #FFFBF4 at 0.36 and
 * 0.30 respectively. The values below hold a ≥5:1 margin over those and no
 * more — every extra point of black is a point of photography thrown away,
 * and this footage is dark to begin with. Re-measure them if the clip is ever
 * swapped; the first cut of this sequence needed a heavier scrim than this
 * one does.
 *
 * The shape differs by cut because the problem does. On a wide viewport the
 * column occupies the left half, so the scrim falls away to almost nothing
 * over the stream and the crema on the right. On a phone the column *is* the
 * viewport, so there is no side to fall away to and the gradient runs top to
 * bottom instead, staying flat and light through the middle where the words
 * are. It mirrors for Arabic, because the column does.
 */
function Scrim({ dir, variant }: { dir: 'ltr' | 'rtl'; variant: 'wide' | 'tall' }) {
  const { progress } = useImmersive();
  const deepenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const tick = (): void => {
      const node = deepenRef.current;
      if (node) {
        // Settles down over the later chapters, where the cup is a held still
        // and the words matter more than the picture.
        node.style.opacity = String(sectionProgress(progress.current, POUR_END, 0.72) * 0.34);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [progress]);

  const side = dir === 'rtl' ? 'left' : 'right';

  const column =
    variant === 'tall'
      ? 'linear-gradient(to bottom, rgba(9,6,4,0.70) 0%, rgba(9,6,4,0.44) 24%, ' +
        'rgba(9,6,4,0.42) 66%, rgba(9,6,4,0.78) 100%)'
      : `linear-gradient(to ${side}, rgba(9,6,4,0.68) 0%, rgba(9,6,4,0.60) 30%, ` +
        `rgba(9,6,4,0.48) 50%, rgba(9,6,4,0.22) 74%, rgba(9,6,4,0.04) 100%)`;

  return (
    <>
      <div className="absolute inset-0" style={{ backgroundImage: column }} />
      {variant === 'wide' ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(9,6,4,0.34) 0%, rgba(9,6,4,0.00) 26%, rgba(9,6,4,0.02) 70%, rgba(9,6,4,0.50) 100%)',
          }}
        />
      ) : null}
      <div ref={deepenRef} className="absolute inset-0 bg-[#090604]" style={{ opacity: 0 }} />
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
