'use client';

import { useEffect, useRef } from 'react';
import { FrameSequence } from '@/lib/webgl/frame-sequence';
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

const beans = manifest.sequences.beans;

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
      beans.basePath,
      variant,
      beans.frameCount,
      Math.round(beans.frameCount * profile.frameBudget),
    );

    let drawnIndex = -1;
    let running = false;
    let started = false;
    let frame = 0;

    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      drawnIndex = -1;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const tick = (): void => {
      frame = requestAnimationFrame(tick);
      if (!running || document.hidden) return;

      // The band's own progress: 0 as its top reaches the bottom of the
      // viewport, 1 as its bottom clears the top.
      const box = section.getBoundingClientRect();
      const travel = box.height + window.innerHeight;
      const local = Math.min(1, Math.max(0, (window.innerHeight - box.top) / travel));

      const target = Math.min(beans.frameCount - 1, Math.round(local * (beans.frameCount - 1)));
      sequence.prioritise(target);

      const pick = sequence.nearest(target);
      if (!pick || pick.index === drawnIndex) return;

      const image = pick.image;
      const cover = Math.max(
        canvas.width / image.naturalWidth,
        canvas.height / image.naturalHeight,
      );
      const w = image.naturalWidth * cover;
      const h = image.naturalHeight * cover;
      context.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      drawnIndex = pick.index;
      canvas.style.opacity = '1';
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
        src={`${beans.basePath}/poster-${variant}.webp`}
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
