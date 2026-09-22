'use client';

import Image from 'next/image';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  ImmersiveProvider,
  sectionProgress,
  useImmersive,
} from '@/components/immersive/scroll-context';
import { SequenceStage } from '@/components/immersive/sequence-stage';
import { FramePoolReadout } from '@/components/immersive/frame-pool-readout';
import { useClientValue } from '@/lib/hooks/use-client-value';
import type { ResolvedThumbnail } from '@/lib/content/menu-display';

/**
 * The scroll narrative shell.
 *
 * The important architectural point: this component renders **no text**. Every
 * word in the story is server-rendered HTML passed in as `children`, and the
 * visuals sit behind it. With JavaScript off, or on a device that gets the
 * still, the page is still a complete, readable article about the café —
 * which is what keeps the SEO of Tier 3 identical to Tier 1 rather than worse.
 *
 * Everything here is real footage, scrubbed frame by frame against the
 * scroll. Photography beats simulation for something the visitor has held in
 * their hand ten thousand times; a shader cannot fake crema and it is obvious
 * when it tries.
 *
 * There used to be a WebGL layer here as well — a few hundred simulated beans
 * drifting through depth in front of the filmed plate. It is gone. It never
 * looked like coffee, it put three.js and a GPU context on a page that is
 * already asking a phone to composite two full-bleed canvases, and "real
 * footage plus obviously fake beans" reads as worse than real footage alone.
 * Filmed beans fall in front of the lens on the story page instead.
 */

export function ImmersiveNarrative({
  children,
  dir,
  closingImage,
}: {
  children: ReactNode;
  dir: 'ltr' | 'rtl';
  closingImage: ResolvedThumbnail;
}) {
  return (
    <ImmersiveProvider>
      <NarrativeBody dir={dir} closingImage={closingImage}>
        {children}
      </NarrativeBody>
    </ImmersiveProvider>
  );
}

function NarrativeBody({
  children,
  dir,
  closingImage,
}: {
  children: ReactNode;
  dir: 'ltr' | 'rtl';
  closingImage: ResolvedThumbnail;
}) {
  const { debug } = useImmersive();
  // `debug` is a client-only determination; rendering it before hydration is
  // a server/client mismatch (React #418).
  const mounted = useClientValue(() => true, false);

  return (
    <>
      {/*
        Four layers, each owning a stretch of the scroll, so something is
        always moving rather than one shot playing for four seconds and then
        holding for the rest of the page.

          the pour    0.00 → 0.32   9.5s of a latte going into a cup
          the beans   0.30 → 0.62   12s of the cascade it was made from
          the room    0.60 → 0.90   a photograph of the warehouse
          the finish  0.86 → 1.00   13s of the art being drawn on top

        They overlap deliberately: each fades up while the one before it is
        still on screen, so the narrative dissolves rather than cuts. The last
        one exists because the page used to run out of footage at 90% and
        spend its final screen on flat colour, which is a strange note for a
        tier whose entire argument is that it keeps moving.
      */}
      <SequenceStage
        sequence="pour"
        dir={dir}
        scrub={[0.012, 0.3]}
        fade={[0, 0, 0.3, 0.38]}
        priority
      />
      <SequenceStage
        sequence="beans"
        dir={dir}
        scrub={[0.32, 0.58]}
        fade={[0.28, 0.36, 0.58, 0.66]}
        drift={0.06}
        deferUntil={0.08}
      />
      <RoomPlate image={closingImage} />
      <SequenceStage
        sequence="latte"
        dir={dir}
        scrub={[0.84, 1]}
        fade={[0.84, 0.92, 1, 1]}
        drift={0.04}
        deferUntil={0.55}
        scrim="even"
      />

      {mounted && debug ? <DebugOverlay /> : null}

      {children}
    </>
  );
}

/**
 * The room, for the chapter that is about the room.
 *
 * The pour holds behind the middle of the narrative, but the last chapter is
 * about a warehouse in Al Quoz, and leaving a coffee cup behind it would be
 * the sort of detail that reads as "stock template" from across a meeting
 * room. One photograph, cross-faded on scroll.
 */
function RoomPlate({ image }: { image: ResolvedThumbnail }) {
  const { progress } = useImmersive();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const tick = (): void => {
      const node = ref.current;
      if (node) {
        const inward = sectionProgress(progress.current, 0.6, 0.68);
        // Hands over to the closing sequence rather than fading to bare
        // background, so the two cross-fade the way the others do.
        const outward = 1 - sectionProgress(progress.current, 0.84, 0.93);
        node.style.opacity = String(Math.min(inward, outward));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [progress]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ opacity: 0, willChange: 'opacity' }}
    >
      <Image
        src={image.src}
        alt=""
        fill
        sizes="100vw"
        quality={60}
        loading="lazy"
        placeholder="blur"
        blurDataURL={image.blurDataURL}
        className="object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(9,6,4,0.72) 0%, rgba(9,6,4,0.45) 40%, rgba(9,6,4,0.82) 100%)',
        }}
      />
    </div>
  );
}

/** ?debug=1 — device profile and live frame stats. */
function DebugOverlay() {
  const { profile } = useImmersive();
  return (
    <div className="fixed bottom-3 left-3 z-[70] rounded-[var(--radius-sm)] bg-black/80 px-3 py-2 font-mono text-[11px] leading-relaxed text-white">
      <div>
        mode <strong>{profile.mode}</strong> · tier {profile.tier} · dpr≤{profile.maxDpr}
      </div>
      <div className="text-white/60">{profile.reason}</div>
      <FramePoolReadout className="text-white/70" />
    </div>
  );
}

/** Reveals its children as the visitor scrolls through a slice of the page. */
export function ScrollReveal({
  start,
  end,
  children,
  className = '',
}: {
  start: number;
  end: number;
  children: ReactNode;
  className?: string;
}) {
  const { progress } = useImmersive();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const node = ref.current;
      if (node) {
        const local = sectionProgress(progress.current, start, end);
        // Ease in over the first third, hold, ease out over the last fifth.
        const opacity = Math.min(1, Math.min(local / 0.28, (1 - local) / 0.18));
        node.style.opacity = String(Math.max(0, opacity));
        node.style.transform = `translate3d(0, ${(0.5 - local) * 36}px, 0)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [progress, start, end]);

  return (
    <div ref={ref} className={className} style={{ willChange: 'opacity, transform' }}>
      {children}
    </div>
  );
}
