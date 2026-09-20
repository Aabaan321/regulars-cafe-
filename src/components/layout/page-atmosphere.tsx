'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { FrameSequence } from '@/lib/webgl/frame-sequence';
import { ScrubPainter, SCRUB_DPR_PLATE } from '@/lib/webgl/scrub-painter';
import { detectDeviceProfile } from '@/lib/webgl/capabilities';
import { useClientValue } from '@/lib/hooks/use-client-value';
import manifest from '@/lib/content/pour-sequence.json';

/**
 * The layer that makes every page feel alive, not just the home page.
 *
 * Tier 3's whole promise is motion, and for a while it delivered that on one
 * page and then dropped the visitor onto a static menu. This runs behind
 * *every* Tier 3 route: real footage, scrubbed by how far down the page you
 * are, so scrolling a page is also playing a shot.
 *
 * It is deliberately cheap: a plate is ~120 frames at ~4KB each, capped again
 * by the device budget and fetched only once the page is idle. A page that
 * costs half a megabyte of decoration *after* it is already interactive is a
 * page that can afford decoration.
 *
 * Tier 2 gets a still frame of the same footage with a slow drift — the same
 * warmth, none of the bytes. Tier 1 gets nothing, and that is the point.
 */

const sequences = manifest.sequences;

type SequenceId = keyof typeof sequences;

/** Routes that run their own narrative and must not have a second layer. */
const OWNS_ITS_BACKGROUND = /^\/(?:ar\/)?immersive\/?$/;

/**
 * Which footage sits behind which page.
 *
 * One clip everywhere reads as wallpaper within about three clicks, so every
 * page family has its own, chosen for what the page is about: extraction
 * behind the menu, the finished drink behind ordering, beans behind the story
 * of where they come from, the room behind visiting it.
 *
 * It costs nothing extra. The frames are all built and committed, and a
 * device only ever fetches the one sequence for the page it has landed on —
 * so nine clips and one clip download identically. What differs is that the
 * site stops feeling themed and starts feeling authored.
 *
 * First match wins, and every nested route falls under its section: a
 * journal entry gets the journal plate, `/book/manage` gets the booking one.
 */
const PLATE_BY_SECTION: readonly (readonly [string, SequenceId])[] = [
  ['/menu', 'espresso'],
  ['/order', 'latte'],
  // The story page has its own bean band in the content, on `cascade`, so its
  // plate is deliberately not beans — two bean shots on one page reads as one
  // clip failing to load twice.
  ['/story', 'grind'],
  ['/journal', 'cascade'],
  ['/visit', 'room'],
  ['/events', 'room'],
  ['/gallery', 'steam'],
  ['/book', 'bloom'],
];

function sequenceForRoute(pathname: string): SequenceId {
  const path = pathname.replace(/^\/ar/, '');
  for (const [section, id] of PLATE_BY_SECTION) {
    if (path.includes(section)) return id;
  }
  // `bloom` is the fallback because it is the least specific of the set: a
  // cup being filled, no room and no hands, so it is safe under copy it was
  // not chosen for.
  return 'bloom';
}

export function PageAtmosphere({ tier, dir }: { tier: string; dir: 'ltr' | 'rtl' }) {
  const pathname = usePathname();
  const mounted = useClientValue(() => true, false);

  if (tier === 'essential') return null;
  if (OWNS_ITS_BACKGROUND.test(pathname)) return null;

  const sequence = sequenceForRoute(pathname);

  return tier === 'immersive' ? (
    <ScrubbedAtmosphere key={sequence} sequence={sequence} dir={dir} mounted={mounted} />
  ) : (
    <StillAtmosphere sequence={sequence} dir={dir} />
  );
}

/* ── Tier 3: the plate, scrubbed by page scroll ─────────────────────────── */

/**
 * How much of a push-in the plate gets across a full page.
 *
 * Smaller than the narrative's, on purpose. This layer sits behind a page's
 * actual content rather than being the thing on screen, and a background that
 * zooms noticeably while you are trying to read a menu is a background that
 * has misunderstood its job.
 */
const PLATE_DRIFT = 0.05;

function ScrubbedAtmosphere({
  sequence,
  dir,
  mounted,
}: {
  sequence: SequenceId;
  dir: 'ltr' | 'rtl';
  mounted: boolean;
}) {
  const spec = sequences[sequence];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const variant = useClientValue<'wide' | 'tall'>(
    () => (window.innerWidth / window.innerHeight < 0.9 ? 'tall' : 'wide'),
    'wide',
  );

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const profile = detectDeviceProfile();
    if (profile.reducedMotion || profile.saveData) return;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    const scrollProgress = (): number => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };

    const frames = new FrameSequence(
      spec.basePath,
      variant,
      spec.frameCount,
      Math.round(spec.frameCount * profile.frameBudget),
    );
    // Starts wherever the visitor already is — a page restored mid-scroll, or
    // one arrived at through an in-page anchor, must not rewind the shot.
    // These pages have no Lenis, so the position is raw scroll and takes the
    // full ease.
    const painter = new ScrubPainter(canvas, frames, context, {
      startProgress: scrollProgress(),
      maxDpr: SCRUB_DPR_PLATE,
    });

    const observer = new ResizeObserver(() => painter.resize());
    observer.observe(canvas);
    painter.resize();

    let frame = 0;
    let previous = 0;
    let revealed = false;

    const tick = (now: number): void => {
      frame = requestAnimationFrame(tick);
      if (document.hidden) {
        previous = now;
        return;
      }

      const delta = previous === 0 ? 16.667 : now - previous;
      previous = now;

      const local = scrollProgress();
      painter.render(local, 1 + PLATE_DRIFT * (1 - local), delta);

      if (!revealed && painter.hasPainted) {
        revealed = true;
        canvas.style.opacity = '1';
      }
    };

    // After `load` and after idle. Decoration never competes with the page.
    let idle = 0;
    const begin = (): void => {
      frames.start();
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
      frames.destroy();
    };
  }, [mounted, variant, spec]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element --
          A decorative background for a canvas that draws over it; it must not
          compete for priority with the page's real LCP image. */}
      <img
        src={`${spec.basePath}/poster-${variant}.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full opacity-0 transition-opacity duration-700"
      />
      <Veil dir={dir} strong />
    </div>
  );
}

/* ── Tier 2: the same warmth, one frame, drifting ───────────────────────── */

function StillAtmosphere({ sequence, dir }: { sequence: SequenceId; dir: 'ltr' | 'rtl' }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative. */}
      <img
        src={`${sequences[sequence].basePath}/poster-wide.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        className="atmosphere-drift absolute inset-0 size-full object-cover"
      />
      <Veil dir={dir} />
    </div>
  );
}

/**
 * The veil.
 *
 * Content sits on its own surfaces above this, so the veil is not doing
 * contrast work for body copy — it is stopping the moving layer reading as a
 * pattern behind translucent panels, and keeping the page's own colour
 * dominant. Heavier on Tier 3, where the layer is actually moving.
 */
function Veil({ dir, strong = false }: { dir: 'ltr' | 'rtl'; strong?: boolean }) {
  const side = dir === 'rtl' ? 'left' : 'right';
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(to ${side}, var(--atmosphere-veil-a), var(--atmosphere-veil-b))`,
        opacity: strong ? 1 : 0.92,
      }}
    />
  );
}

function requestIdle(callback: () => void): number {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(callback, { timeout: 3000 });
  }
  return window.setTimeout(callback, 600);
}

function cancelIdle(handle: number): void {
  if (handle === 0) return;
  if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(handle);
  else window.clearTimeout(handle);
}
