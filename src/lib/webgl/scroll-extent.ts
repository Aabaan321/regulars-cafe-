'use client';

/**
 * How far this page can scroll, without asking the layout engine every frame.
 *
 * `document.documentElement.scrollHeight` is not a stored number. Reading it
 * forces the browser to flush pending style and layout work so it can answer
 * honestly, and the scrub loops were reading it — along with
 * `window.innerHeight` — once per animation frame, on every Immersive page.
 * That is a forced synchronous layout sixty times a second for a value that
 * changes perhaps five times in a visit.
 *
 * So it is measured once and re-measured only when something could actually
 * have changed it: the window resizing, the document's own box resizing
 * (which covers images arriving, fonts swapping, an accordion opening), and
 * orientation changes. Measurement is deferred to the next frame so a burst
 * of mutations costs one layout rather than one each.
 *
 * One module-level observer serves every consumer on the page, because three
 * sequences on the home page asking the same question separately is three
 * times the work for one answer.
 */

let extent = 0;
let viewport = 0;
let subscribers = 0;
let pending = 0;
let observer: ResizeObserver | null = null;

function measure(): void {
  pending = 0;
  viewport = window.innerHeight;
  extent = Math.max(0, document.documentElement.scrollHeight - viewport);
}

function schedule(): void {
  if (pending !== 0) return;
  pending = requestAnimationFrame(measure);
}

/**
 * Starts tracking, and returns the matching stop.
 *
 * Reference-counted: the first caller sets the listeners up, the last one to
 * leave tears them down.
 */
export function trackScrollExtent(): () => void {
  subscribers += 1;
  if (subscribers === 1) {
    measure();
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });
    observer = new ResizeObserver(schedule);
    observer.observe(document.documentElement);
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    subscribers -= 1;
    if (subscribers > 0) return;
    window.removeEventListener('resize', schedule);
    window.removeEventListener('orientationchange', schedule);
    observer?.disconnect();
    observer = null;
    if (pending !== 0) cancelAnimationFrame(pending);
    pending = 0;
  };
}

/** 0–1 down the page, from the cached extent. */
export function scrollProgress(): number {
  if (extent <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / extent));
}

/** The scrollable distance in pixels, cached. */
export function scrollExtent(): number {
  return extent;
}

/** The viewport height, cached alongside it. */
export function viewportHeight(): number {
  return viewport;
}
