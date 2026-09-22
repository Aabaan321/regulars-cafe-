'use client';

import { useEffect, useRef } from 'react';
import { sectionProgress, useImmersive } from '@/components/immersive/scroll-context';
import manifest from '@/lib/content/pour-sequence.json';

/**
 * The pour's current frame, live.
 *
 * Reads the same scroll range and the same frame count the sequence itself
 * uses, so the number on screen is the number being drawn behind it rather
 * than an animation that merely looks plausible. If the cut changes, this
 * changes with it — there is nothing here to keep in sync by hand.
 *
 * Written straight to the DOM from an animation frame, never through React
 * state: this updates sixty times a second and a re-render per frame to move
 * three digits would be an absurd way to spend a phone's battery.
 *
 * Decoration, so `aria-hidden`. The paragraph beside it already says in words
 * what it is showing.
 */

/** Must match the pour layer's `scrub` in `narrative.tsx`. */
const SCRUB: readonly [number, number] = [0.012, 0.3];

const pour = manifest.sequences.pour;

export function PourReadout({ label }: { label: string }) {
  const { progress } = useImmersive();
  const valueRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    let shown = -1;
    const last = pour.frameCount - 1;

    const tick = (): void => {
      frame = requestAnimationFrame(tick);
      const local = sectionProgress(progress.current, SCRUB[0], SCRUB[1]);
      const index = Math.round(local * last);
      if (index === shown) return;
      shown = index;

      const value = valueRef.current;
      if (value) value.textContent = String(index + 1).padStart(3, '0');
      const bar = barRef.current;
      if (bar) bar.style.transform = `scaleX(${local})`;
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [progress]);

  return (
    <div aria-hidden="true">
      <p className="flex items-baseline gap-3">
        <span className="font-display text-[clamp(2.6rem,6vw,3.8rem)] leading-none tracking-[-0.02em] text-[#FFFBF4] tabular-nums">
          <span ref={valueRef}>001</span>
          <span className="text-[0.38em] text-[#8F8070]"> / {pour.frameCount}</span>
        </span>
        <span className="text-2xs font-bold tracking-[0.16em] text-[#C9B9A4] uppercase">
          {label}
        </span>
      </p>
      <span className="mt-4 block h-px w-full bg-white/15">
        <span
          ref={barRef}
          className="block h-px w-full origin-left bg-[#E3894A]"
          style={{ transform: 'scaleX(0)' }}
        />
      </span>
    </div>
  );
}
