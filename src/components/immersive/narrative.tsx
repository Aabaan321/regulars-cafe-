'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ImmersiveProvider,
  sectionProgress,
  useImmersive,
} from '@/components/immersive/scroll-context';
import { PourStage } from '@/components/immersive/pour-stage';
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
 * Two layers, each doing the job it is actually good at:
 *
 *  1. **The pour** — a real filmed pour, scrubbed frame by frame against the
 *     scroll. Photography beats simulation for something the visitor has held
 *     in their hand ten thousand times; a shader cannot fake crema and it is
 *     obvious when it tries.
 *  2. **The bean field** — genuinely procedural, genuinely WebGL, because a
 *     few hundred beans drifting through real depth is something no film can
 *     give you and no sequence of stills can scrub.
 *
 * The WebGL layer is loaded with `next/dynamic` *and* only mounted once the
 * visitor is approaching the chapter that uses it, so three.js is neither in
 * the server bundle nor on the boot path, and a visitor who never scrolls
 * that far never pays for it at all.
 */

const ImmersiveStage = dynamic(
  () => import('@/components/immersive/stage').then((m) => m.ImmersiveStage),
  { ssr: false },
);

/** Global scroll position at which three.js is worth fetching. */
const WEBGL_ARMS_AT = 0.2;

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
  const { profile, debug } = useImmersive();
  // `profile` and `debug` are both client-only determinations; rendering
  // either before hydration is a server/client mismatch (React #418).
  const mounted = useClientValue(() => true, false);

  return (
    <>
      <PourStage dir={dir} />
      <RoomPlate image={closingImage} />

      {mounted && profile.mode === 'webgl' ? <ArmedStage /> : null}
      {mounted && debug ? <DebugOverlay /> : null}

      {children}
    </>
  );
}

/**
 * Holds three.js back until the visitor is most of the way through the pour.
 *
 * Roughly 380KB of JavaScript and a GPU context, fetched on a scroll gesture
 * the visitor has already committed to, rather than during the two seconds
 * where every byte is competing with the page they came to read.
 */
function ArmedStage() {
  const { progress } = useImmersive();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (armed) return;
    let frame = 0;
    const tick = (): void => {
      if (progress.current >= WEBGL_ARMS_AT) {
        setArmed(true);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [armed, progress]);

  return armed ? <ImmersiveStage /> : null;
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
        const inward = sectionProgress(progress.current, 0.6, 0.71);
        const outward = 1 - sectionProgress(progress.current, 0.82, 0.9);
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
      <div id="immersive-debug-fps">webgl idle</div>
      <div id="immersive-debug-frames">sequence idle</div>
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
