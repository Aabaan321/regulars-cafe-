'use client';

import { useEffect, useRef } from 'react';
import { framePoolStats } from '@/lib/webgl/frame-sequence';

/**
 * `?debug=1` — what the page's frame cache is holding, live.
 *
 * Read every frame rather than pushed on load, because the interesting case
 * is a sequence that has *stopped* loading: one that has scrolled off screen
 * and shed its frames reports nothing, so anything driven by load callbacks
 * shows its last value forever and hides exactly the behaviour worth
 * watching.
 */
export function FramePoolReadout({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const tick = (): void => {
      frame = requestAnimationFrame(tick);
      const node = ref.current;
      if (!node) return;
      const { sequences, active, frames, megabytes, budgetMegabytes } = framePoolStats();
      node.textContent =
        `frames ${frames} · ${megabytes}/${budgetMegabytes}MB · ` + `${active}/${sequences} active`;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <div ref={ref} className={className} />;
}
