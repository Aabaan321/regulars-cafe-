'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Reads a value that only exists in the browser, without a cascading render.
 *
 * The obvious way to do this — `useState(fallback)` plus a `useEffect` that
 * immediately calls `setState` — renders twice on every mount and is what
 * `react-hooks/set-state-in-effect` is warning about. `useSyncExternalStore`
 * is the API built for it: React takes the server snapshot during SSR and the
 * client snapshot from the first client render onwards, with no extra pass and
 * no hydration mismatch.
 *
 * `read` must return a primitive (or a stable reference); React compares
 * snapshots by identity and will loop on a fresh object each call.
 */
export function useClientValue<T extends string | number | boolean | null>(
  read: () => T,
  serverValue: T,
): T {
  const getServerSnapshot = useCallback(() => serverValue, [serverValue]);
  return useSyncExternalStore(subscribeNever, read, getServerSnapshot);
}

/** The value never changes on its own, so nothing needs to be subscribed. */
function subscribeNever(): () => void {
  return () => {};
}

/**
 * Subscribes to window scroll and reports whether the page has moved past
 * `threshold`. Returns false during SSR.
 */
export function useScrolledPast(threshold: number): boolean {
  const getSnapshot = useCallback(() => window.scrollY > threshold, [threshold]);
  return useSyncExternalStore(subscribeToScroll, getSnapshot, getFalse);
}

function subscribeToScroll(onChange: () => void): () => void {
  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange, { passive: true });
  return () => {
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
}

function getFalse(): boolean {
  return false;
}

/** Reads a localStorage key once, safely. Returns null when unavailable. */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Private mode, blocked cookies, or a sandboxed iframe.
    return null;
  }
}

export function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — the in-memory state still applies for this visit */
  }
}
