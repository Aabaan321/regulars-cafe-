'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';
import { detectDeviceProfile, debugEnabled, type DeviceProfile } from '@/lib/webgl/capabilities';

/**
 * Smooth scrolling, and the single source of scroll progress.
 *
 * Lenis drives the page; every scene reads progress from this context rather
 * than attaching its own scroll listener, so there is one rAF loop for the
 * whole narrative instead of one per section.
 *
 * Progress is kept in a ref, not state: the scenes read it inside their own
 * frame loop. Publishing it through React state would re-render the entire
 * tree sixty times a second to move a coffee level.
 */

export interface ScrollState {
  /** 0–1 through the whole narrative. */
  readonly progress: { current: number };
  /** Raw pixels, for anything that needs absolute position. */
  readonly scrollY: { current: number };
  readonly velocity: { current: number };
}

interface ImmersiveContextValue extends ScrollState {
  readonly profile: DeviceProfile;
  readonly debug: boolean;
  /** False until the narrative's assets are ready. */
  readonly ready: boolean;
  readonly setReady: (ready: boolean) => void;
}

const ImmersiveContext = createContext<ImmersiveContextValue | null>(null);

export function useImmersive(): ImmersiveContextValue {
  const value = useContext(ImmersiveContext);
  if (!value) throw new Error('useImmersive must be used inside <ImmersiveProvider>');
  return value;
}

export function ImmersiveProvider({ children }: { children: ReactNode }) {
  const progress = useRef(0);
  const scrollY = useRef(0);
  const velocity = useRef(0);
  const [ready, setReady] = useState(false);

  // Detected once, during the first client render, so the first paint already
  // knows which experience it is rendering.
  const [profile] = useState<DeviceProfile>(() => detectDeviceProfile());
  const [debug] = useState<boolean>(() => debugEnabled());

  useEffect(() => {
    // Smooth scrolling is a motion effect. Someone who asked for less movement
    // gets the browser's native scroll, which is also what the fallback wants.
    if (profile.mode === 'fallback' || profile.reducedMotion) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      // Never on touch: hijacking a phone's scroll is the fastest way to make
      // a site feel broken, and momentum there is already good.
      syncTouch: false,
    });

    let frame = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollY.current = lenis.scroll;
      progress.current = max > 0 ? Math.min(1, Math.max(0, lenis.scroll / max)) : 0;
      velocity.current = lenis.velocity;
    };
    lenis.on('scroll', onScroll);
    onScroll();

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [profile.mode, profile.reducedMotion]);

  // The fallback still needs progress, just from the native scroll position.
  useEffect(() => {
    if (profile.mode === 'webgl' && !profile.reducedMotion) return;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollY.current = window.scrollY;
      progress.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [profile.mode, profile.reducedMotion]);

  const value = useMemo<ImmersiveContextValue>(
    () => ({ progress, scrollY, velocity, profile, debug, ready, setReady }),
    [profile, debug, ready],
  );

  return <ImmersiveContext.Provider value={value}>{children}</ImmersiveContext.Provider>;
}

/**
 * Maps global scroll progress onto a section's own 0–1 range.
 *
 * `start` and `end` are fractions of the page. A scene that owns the second
 * fifth of the narrative asks for `sectionProgress(p, 0.2, 0.4)` and gets a
 * clean 0→1 as the visitor moves through it — and a clean 1→0 scrolling back,
 * which is what makes the pour scrub rather than play.
 */
export function sectionProgress(global: number, start: number, end: number): number {
  if (end <= start) return 0;
  return Math.min(1, Math.max(0, (global - start) / (end - start)));
}
