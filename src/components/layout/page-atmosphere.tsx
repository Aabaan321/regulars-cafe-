'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { FrameSequence } from '@/lib/webgl/frame-sequence';
import { detectDeviceProfile } from '@/lib/webgl/capabilities';
import { useClientValue } from '@/lib/hooks/use-client-value';
import manifest from '@/lib/content/pour-sequence.json';

/**
 * The layer that makes every page feel alive, not just the home page.
 *
 * Tier 3's whole promise is motion, and for a while it delivered that on one
 * page and then dropped the visitor onto a static menu. This runs behind
 * *every* Tier 3 route: cream blooming through coffee, scrubbed by how far
 * down the page you are.
 *
 * The clip was chosen for what it does not contain. There is no cup, no hand
 * and no horizon, so it never fights the text column and never looks wrong at
 * an unexpected crop — it can sit under a menu, a booking form or a journal
 * entry without any of them being laid out around it. Abstract is the
 * requirement here, not a preference.
 *
 * It is deliberately cheap: 72 frames at ~6KB each, capped again by the
 * device budget, fetched only once the page is idle. A page that costs half a
 * megabyte of decoration after it is already interactive is a page that can
 * afford decoration.
 *
 * Tier 2 gets a still frame of the same footage with a slow drift — the same
 * warmth, none of the bytes. Tier 1 gets nothing, and that is the point.
 */

const bloom = manifest.sequences.bloom;

/** Routes that run their own narrative and must not have a second layer. */
const OWNS_ITS_BACKGROUND = /^\/(?:ar\/)?immersive\/?$/;

export function PageAtmosphere({ tier, dir }: { tier: string; dir: 'ltr' | 'rtl' }) {
  const pathname = usePathname();
  const mounted = useClientValue(() => true, false);

  if (tier === 'essential') return null;
  if (OWNS_ITS_BACKGROUND.test(pathname)) return null;

  return tier === 'immersive' ? (
    <ScrubbedAtmosphere dir={dir} mounted={mounted} />
  ) : (
    <StillAtmosphere dir={dir} />
  );
}

/* ── Tier 3: the bloom, scrubbed by page scroll ─────────────────────────── */

function ScrubbedAtmosphere({ dir, mounted }: { dir: 'ltr' | 'rtl'; mounted: boolean }) {
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

    const sequence = new FrameSequence(
      bloom.basePath,
      variant,
      bloom.frameCount,
      Math.round(bloom.frameCount * profile.frameBudget),
    );

    let drawn = -1;
    let frame = 0;

    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      drawn = -1;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const tick = (): void => {
      frame = requestAnimationFrame(tick);
      if (document.hidden) return;

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const local = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const target = Math.min(bloom.frameCount - 1, Math.round(local * (bloom.frameCount - 1)));
      sequence.prioritise(target);

      const pick = sequence.nearest(target);
      if (!pick || pick.index === drawn) return;

      const image = pick.image;
      const cover = Math.max(
        canvas.width / image.naturalWidth,
        canvas.height / image.naturalHeight,
      );
      const w = image.naturalWidth * cover;
      const h = image.naturalHeight * cover;
      context.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      drawn = pick.index;
      canvas.style.opacity = '1';
    };

    // After `load` and after idle. Decoration never competes with the page.
    let idle = 0;
    const begin = (): void => {
      sequence.start();
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
  }, [mounted, variant]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element --
          A decorative background for a canvas that draws over it; it must not
          compete for priority with the page's real LCP image. */}
      <img
        src={`${bloom.basePath}/poster-${variant}.webp`}
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

function StillAtmosphere({ dir }: { dir: 'ltr' | 'rtl' }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative. */}
      <img
        src={`${bloom.basePath}/poster-wide.webp`}
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
