'use client';

/**
 * Loads a scroll-scrubbed image sequence without ever blocking the page.
 *
 * The naive version of this — fetch frame 0, then 1, then 2 — is unusable:
 * you cannot scrub until the whole sequence has arrived, so on anything short
 * of office wifi the visitor scrolls through a still picture for ten seconds
 * and concludes the effect is broken.
 *
 * So frames arrive in **binary subdivision order**: both ends first, then the
 * midpoint, then the midpoints of those halves, and so on. The sequence is
 * coarsely scrubbable after a handful of frames and refines from there, which
 * means the pour animates almost immediately and simply gets smoother. It is
 * progressive JPEG, applied to time instead of space.
 *
 * Whatever the visitor is actually looking at jumps the queue (`prioritise`),
 * so a fast scroll into the middle of the pour fetches that frame next rather
 * than after the forty it happens to sit behind.
 */

const CONCURRENCY = 6;

type FrameState = 0 | 1 | 2 | 3; // idle · loading · ready · failed

export interface SequenceProgress {
  readonly loaded: number;
  readonly total: number;
}

export class FrameSequence {
  readonly count: number;
  private readonly urls: readonly string[];
  private readonly images: (HTMLImageElement | null)[];
  private readonly states: FrameState[];
  private queue: number[];
  private inFlight = 0;
  private loadedCount = 0;
  private destroyed = false;
  private onChange: ((progress: SequenceProgress) => void) | null = null;

  /**
   * `budget` caps how many of the `count` frames this device will ever fetch.
   *
   * The sequences are cut at the frame rate the best device deserves, and the
   * budget is what keeps that from punishing the worst one: a desktop on wifi
   * takes all 120, a mid-range phone on 4G takes 60, a slow connection takes
   * 40. Because frames arrive in binary-subdivision order, a budget is not a
   * truncation — every prefix of that order is an even sample of the whole
   * shot, so a budgeted device gets the entire pour at a lower frame rate
   * rather than the first third of it at full rate.
   */
  constructor(basePath: string, variant: string, count: number, budget = count) {
    this.count = count;
    this.urls = Array.from(
      { length: count },
      (_, i) => `${basePath}/${variant}/${String(i).padStart(3, '0')}.webp`,
    );
    this.images = Array.from({ length: count }, () => null);
    this.states = Array.from({ length: count }, () => 0 as FrameState);
    this.queue = subdivisionOrder(count).slice(0, Math.max(2, Math.min(budget, count)));
    this.allowed = new Set(this.queue);
  }

  /** Frames within this device's budget. Anything else is never requested. */
  private readonly allowed: ReadonlySet<number>;

  /** Starts fetching. Safe to call more than once. */
  start(onChange?: (progress: SequenceProgress) => void): void {
    if (this.destroyed) return;
    if (onChange) this.onChange = onChange;
    this.pump();
  }

  /**
   * Moves a frame to the head of the queue.
   *
   * Called every time the drawn frame changes, so the queue continuously
   * re-sorts itself around wherever the visitor actually is.
   */
  prioritise(index: number): void {
    if (this.destroyed) return;
    if (index < 0 || index >= this.count) return;
    if (!this.allowed.has(index)) return;
    if (this.states[index] !== 0) return;

    const at = this.queue.indexOf(index);
    if (at > 0) {
      this.queue.splice(at, 1);
      this.queue.unshift(index);
    }
    this.pump();
  }

  /** The frame itself, or null if it has not arrived. */
  frame(index: number): HTMLImageElement | null {
    if (this.states[index] !== 2) return null;
    return this.images[index] ?? null;
  }

  /** How many frames this device will fetch in total. */
  get budget(): number {
    return this.allowed.size;
  }

  /**
   * The nearest loaded frame at or before `index`, within `limit` steps.
   *
   * Directional rather than outward, because the caller is cross-fading and
   * needs one frame on each side of a position — not simply the closest one,
   * which could be on either.
   */
  before(index: number, limit: number): { image: HTMLImageElement; index: number } | null {
    for (let i = Math.min(index, this.count - 1); i >= Math.max(0, index - limit); i -= 1) {
      const image = this.frame(i);
      if (image) return { image, index: i };
    }
    return null;
  }

  /** The nearest loaded frame at or after `index`, within `limit` steps. */
  after(index: number, limit: number): { image: HTMLImageElement; index: number } | null {
    for (let i = Math.max(index, 0); i <= Math.min(this.count - 1, index + limit); i += 1) {
      const image = this.frame(i);
      if (image) return { image, index: i };
    }
    return null;
  }

  /**
   * The closest frame we can actually draw.
   *
   * Searching outward rather than picking frame 0 is what makes the partial
   * sequence look like a low-frame-rate pour instead of a frozen one.
   */
  nearest(index: number): { image: HTMLImageElement; index: number } | null {
    const exact = this.frame(index);
    if (exact) return { image: exact, index };

    for (let offset = 1; offset < this.count; offset += 1) {
      const before = index - offset;
      const after = index + offset;
      const a = before >= 0 ? this.frame(before) : null;
      if (a) return { image: a, index: before };
      const b = after < this.count ? this.frame(after) : null;
      if (b) return { image: b, index: after };
    }
    return null;
  }

  get progress(): SequenceProgress {
    return { loaded: this.loadedCount, total: this.allowed.size };
  }

  destroy(): void {
    this.destroyed = true;
    this.queue = [];
    this.onChange = null;
    for (let i = 0; i < this.images.length; i += 1) {
      const image = this.images[i];
      // Dropping `src` lets the browser abort an in-flight request and frees
      // the decoded bitmap; a 72-frame sequence left resident is real memory
      // on a phone.
      if (image && this.states[i] !== 2) image.src = '';
      this.images[i] = null;
    }
  }

  private pump(): void {
    while (!this.destroyed && this.inFlight < CONCURRENCY && this.queue.length > 0) {
      const index = this.queue.shift();
      if (index === undefined) return;
      if (this.states[index] !== 0) continue;
      void this.load(index);
    }
  }

  private async load(index: number): Promise<void> {
    const url = this.urls[index];
    if (!url) return;

    this.states[index] = 1;
    this.inFlight += 1;

    const image = new Image();
    // Low priority throughout: the sequence is decoration and must never
    // compete with the fonts, the CSS, or the poster for bandwidth.
    image.fetchPriority = 'low';
    image.decoding = 'async';
    this.images[index] = image;

    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error(`frame ${index} failed`));
        image.src = url;
      });
      // Decode off the main thread so the first `drawImage` cannot jank.
      if (typeof image.decode === 'function') {
        await image.decode().catch(() => undefined);
      }
      if (this.destroyed) return;
      this.states[index] = 2;
      this.loadedCount += 1;
      this.onChange?.(this.progress);
    } catch {
      // A single missing frame is survivable — `nearest` simply skips it.
      this.states[index] = 3;
      this.images[index] = null;
    } finally {
      this.inFlight -= 1;
      this.pump();
    }
  }
}

/**
 * Both ends, then midpoints, then midpoints of those: 0, 71, 35, 17, 53, …
 *
 * Every prefix of this order is a roughly even sample of the whole sequence,
 * which is the property that makes a half-loaded pour still look like a pour.
 */
export function subdivisionOrder(count: number): number[] {
  if (count <= 0) return [];

  const order: number[] = [];
  const seen = new Uint8Array(count);
  const push = (index: number): void => {
    if (index < 0 || index >= count || seen[index]) return;
    seen[index] = 1;
    order.push(index);
  };

  push(0);
  push(count - 1);

  const spans: [number, number][] = [[0, count - 1]];
  while (spans.length > 0) {
    const span = spans.shift();
    if (!span) break;
    const [low, high] = span;
    const mid = (low + high) >> 1;
    if (mid === low || mid === high) continue;
    push(mid);
    spans.push([low, mid], [mid, high]);
  }

  // Anything the subdivision missed (it cannot, but the draw loop depends on
  // every frame eventually being queued, so this is not left to an argument).
  for (let i = 0; i < count; i += 1) push(i);

  return order;
}
