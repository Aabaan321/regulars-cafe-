'use client';

import { useEffect, useRef } from 'react';
import { FrameSequence } from '@/lib/webgl/frame-sequence';
import { ScrubPainter, SCRUB_DPR_PLATE } from '@/lib/webgl/scrub-painter';
import { detectDeviceProfile } from '@/lib/webgl/capabilities';
import { useClientValue } from '@/lib/hooks/use-client-value';
import manifest from '@/lib/content/pour-sequence.json';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * A band of real coffee beans, falling, scrubbed by its own position on the
 * page.
 *
 * Standalone on purpose. The Immersive home page drives its sequences from a
 * shared scroll context because it has four of them to keep in step; an
 * ordinary page has one, and making the story page mount the whole narrative
 * provider to animate a single band would be a lot of machinery for one
 * effect. This measures itself instead: as the section crosses the viewport,
 * its own 0→1 progress drives the frames.
 *
 * It degrades the same way everything else here does — reduced motion and
 * Save-Data get the poster and fetch nothing — and the heading over it is
 * real server-rendered HTML, so the band is decoration over a readable page
 * rather than the page.
 */

/*
 * The band runs on `cascade`, not on the narrative's `beans`.
 *
 * Two reasons, and they point the same way. It is a band rather than a
 * full-bleed hero, so it does not need hero frames — plate frames are half
 * the bytes at a size nobody can tell apart inside a 78svh strip. And
 * `cascade` is the better shot for it: beans falling onto a bed of more
 * beans, endlessly, with no beginning or end, which is what a band you can
 * scroll past in either direction wants. `beans` is a shot that progresses,
 * and progression belongs to the narrative that has a whole page to spend
 * on it.
 */
const band = manifest.sequences.cascade;

export function BeanBand({
  locale,
  heading,
  body,
}: {
  locale: Locale;
  heading: string;
  body: string;
}) {
  const ar = locale === 'ar';
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const variant = useClientValue<'wide' | 'tall'>(
    () => (window.innerWidth / window.innerHeight < 0.9 ? 'tall' : 'wide'),
    'wide',
  );
  const mounted = useClientValue(() => true, false);

  useEffect(() => {
    if (!mounted) return;
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const profile = detectDeviceProfile();
    if (profile.reducedMotion || profile.saveData) return;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    const sequence = new FrameSequence(
      band.basePath,
      variant,
      band.frameCount,
      // Three fifths of the usual budget on top of the device's own. The band
      // is one strip of one page, scrubbed across its own travel rather than
      // a whole document's, so it crosses its frames far faster than a plate
      // does and simply does not need all of them.
      Math.round(band.frameCount * profile.frameBudget * 0.6),
    );

    // Plate footage, built soft — a retina backing store would be spent
    // resolving a blur.
    const painter = new ScrubPainter(canvas, sequence, context, { maxDpr: SCRUB_DPR_PLATE });
    let running = false;
    let started = false;
    let frame = 0;
    let previous = 0;

    const resizeObserver = new ResizeObserver(() => painter.resize());
    resizeObserver.observe(canvas);
    painter.resize();

    const tick = (now: number): void => {
      frame = requestAnimationFrame(tick);
      if (!running || document.hidden) {
        previous = now;
        return;
      }

      const delta = previous === 0 ? 16.667 : now - previous;
      previous = now;

      // The band's own progress: 0 as its top reaches the bottom of the
      // viewport, 1 as its bottom clears the top.
      const box = section.getBoundingClientRect();
      const travel = box.height + window.innerHeight;
      const local = Math.min(1, Math.max(0, (window.innerHeight - box.top) / travel));

      painter.render(local, 1, delta);
      if (painter.hasPainted) canvas.style.opacity = '1';
    };

    // Nothing is fetched until the band is close enough to matter — on the story
    // page it is three screens down, and most visitors never reach it.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        running = entry?.isIntersecting ?? false;
        if (running && !started) {
          started = true;
          sequence.start();
        }
      },
      { rootMargin: '40% 0px' },
    );
    visibility.observe(section);

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      sequence.destroy();
    };
  }, [mounted, variant]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="bean-band-heading"
      className="relative isolate flex min-h-[78svh] items-center overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element --
          The poster is a plain <img> rather than next/image because it is a
          decorative background for a canvas that will draw over it, and it
          must not compete for the priority budget with the page's real LCP
          image further up. */}
      <img
        src={`${band.basePath}/poster-${variant}.webp`}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 -z-20 size-full opacity-0 transition-opacity duration-500"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(9,6,4,0.78) 0%, rgba(9,6,4,0.52) 42%, rgba(9,6,4,0.86) 100%)',
        }}
      />

      <div className="container-page relative">
        <div className="max-w-[34rem]">
          <p className="text-2xs mb-3 font-bold tracking-[0.2em] text-[#E3894A] uppercase">
            {ar ? 'من الحبة إلى الفنجان' : 'Bean to cup'}
          </p>
          <h2 id="bean-band-heading" className="display-2 text-[#FFFBF4]">
            {heading}
          </h2>
          <p className="mt-5 text-lg leading-[1.6] text-[#E8DCCC]">{body}</p>
        </div>
      </div>
    </section>
  );
}
