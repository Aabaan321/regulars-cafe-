'use client';

/**
 * Loads a scroll-scrubbed image sequence without ever blocking the page, and
 * without ever holding more decoded pixels than the device can afford.
 *
 * Three problems, three techniques.
 *
 * **Order.** The naive version — fetch frame 0, then 1, then 2 — is unusable:
 * you cannot scrub until the whole sequence has arrived, so on anything short
 * of office wifi the visitor scrolls through a still picture for ten seconds
 * and concludes the effect is broken. So frames arrive in **binary
 * subdivision order**: both ends first, then the midpoint, then the midpoints
 * of those halves. Every prefix of that order is an even sample of the whole
 * shot, so the sequence is coarsely scrubbable after a handful of frames and
 * refines from there. It is progressive JPEG, applied to time instead of
 * space. Whatever the visitor is actually looking at jumps the queue
 * (`prioritise`), so a fast scroll into the middle fetches that frame next
 * rather than after the forty it happens to sit behind.
 *
 * **Memory.** This is the one that mattered. A frame's *file* is 5–15KB; its
 * *decoded bitmap* is width × height × 4 bytes, so a 704×940 portrait frame
 * costs 2.6MB resident. An earlier version of this class simply kept every
 * frame it had ever loaded, which meant a phone on the Immersive home page
 * accumulated about 640MB across its three sequences and a desktop about
 * 1.4GB. iOS Safari starts evicting tabs somewhere north of 200MB, so what
 * that actually looked like was a background that stuttered, froze, and
 * reloaded itself mid-scroll. Frames are now capped by a *byte* budget and
 * the ones furthest from where the visitor is looking are released.
 *
 * **Decoding.** `new Image()` decodes on (or near) the main thread and gives
 * no way to free the result — dropping `src` is a hint, not a deallocation.
 * `createImageBitmap` decodes off-thread, draws faster because there is no
 * per-draw colour conversion, and `close()` frees immediately and
 * deterministically. That last property is what makes the byte budget real
 * rather than aspirational. Browsers without it fall back to `Image`.
 */

/**
 * How many bytes of decoded frames may be resident at once.
 *
 * Not a frame count, because a frame is not a fixed size: the same budget has
 * to cover a 1280×720 desktop plate and a 528×716 phone one. Phones get a
 * quarter of what desktops do — iOS in particular will evict a tab that grows
 * past a few hundred megabytes, and the whole point of this layer is that it
 * is decoration.
 */
const MEMORY_BUDGET_DESKTOP = 256 * 1024 * 1024;
const MEMORY_BUDGET_PHONE = 96 * 1024 * 1024;

/** Never keep fewer than this, or a fast scroll evicts what it is drawing. */
const MIN_RESIDENT = 10;

/**
 * What a sequence keeps while its layer is off screen.
 *
 * Enough to draw *something* the instant the visitor scrolls back to it —
 * both ends and a couple of midpoints — and not a byte more.
 */
const SHED_RESIDENT = 4;

/* ── The shared pool ──────────────────────────────────────────────────────
 *
 * The budget belongs to the *page*, not to each sequence, and this is the
 * distinction an earlier version got wrong: three sequences each politely
 * staying under a 56MB cap is a 167MB page, which on a phone is still enough
 * to get the tab evicted.
 *
 * So live sequences register here and share one allowance. And they do not
 * share it equally: the Immersive home page runs three layers across disjoint
 * stretches of the scroll, so at any moment two of them are invisible.
 * Invisible layers shed down to a handful of frames and the one you are
 * actually looking at gets the rest — which is how a three-sequence page ends
 * up costing about what a one-sequence page does.
 */

const live = new Set<FrameSequence>();

/**
 * What the page's frame cache is holding right now, live.
 *
 * Exposed for the `?debug=1` readout, and it is the number that actually
 * matters: a per-sequence figure can be read while another sequence is
 * quietly holding twice as much, and the browser only sees the total.
 */
export function framePoolStats(): {
  sequences: number;
  active: number;
  frames: number;
  megabytes: number;
  budgetMegabytes: number;
} {
  let frames = 0;
  let bytes = 0;
  let active = 0;
  let budget = 0;
  for (const sequence of live) {
    const held = sequence.residency;
    frames += held.frames;
    bytes += held.frames * sequence.frameBytes;
    if (sequence.isActive) active += 1;
    budget = sequence.budgetBytes;
  }
  return {
    sequences: live.size,
    active,
    frames,
    megabytes: Math.round(bytes / 1048576),
    budgetMegabytes: Math.round(budget / 1048576),
  };
}

function rebalance(): void {
  /*
   * Shed sequences are not free — they keep a few frames so that scrolling
   * back to them shows something immediately — so their cost comes off the
   * top before the active ones divide what is left. Without that the budget
   * is only approximate: one active sequence taking the whole allowance plus
   * two shed ones holding ten megabytes each overruns it by a fifth.
   */
  let active = 0;
  let reserved = 0;
  for (const sequence of live) {
    if (sequence.isActive) active += 1;
    else reserved += SHED_RESIDENT * sequence.frameBytes;
  }
  const share = Math.max(1, active);
  for (const sequence of live) sequence.applyShare(share, reserved);
}

type FrameState = 0 | 1 | 2 | 3; // idle · loading · ready · failed

/** Anything `drawImage` accepts and we know the intrinsic size of. */
export interface Frame {
  readonly source: CanvasImageSource;
  readonly width: number;
  readonly height: number;
}

export interface SequenceProgress {
  readonly loaded: number;
  readonly total: number;
}

function isPhone(): boolean {
  if (typeof window === 'undefined') return true;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === 'number' && memory > 0 && memory <= 4) return true;
  return window.matchMedia('(pointer: coarse)').matches;
}

export class FrameSequence {
  readonly count: number;
  private readonly urls: readonly string[];
  private readonly frames: (Frame | null)[];
  private readonly states: FrameState[];
  /** Load order, newest last — the eviction candidates, oldest first. */
  private readonly resident: number[] = [];
  private queue: number[];
  private readonly allowed: ReadonlySet<number>;
  private readonly concurrency: number;
  private readonly memoryBudget: number;
  /** Measured from the first decoded frame; every frame is the same size. */
  private bytesPerFrame = 0;
  private maxResident = Number.MAX_SAFE_INTEGER;
  /** Where the visitor is, so eviction can take from the far end. */
  private focus = 0;
  /** Allowed frames not currently loaded or in flight. Kept as a count so
   *  the draw loop's per-frame `prioritise` cannot turn into a scan. */
  private idleCount: number;
  /** Whether this sequence's layer is on screen and worth holding frames for. */
  private active = true;
  private inFlight = 0;
  private loadedCount = 0;
  private destroyed = false;
  private onChange: ((progress: SequenceProgress) => void) | null = null;

  /**
   * `budget` caps how many of the `count` frames this device will ever fetch.
   *
   * The sequences are cut at the frame rate the best device deserves, and the
   * budget is what keeps that from punishing the worst one. Because frames
   * arrive in binary-subdivision order, a budget is not a truncation — every
   * prefix of that order is an even sample of the whole shot, so a budgeted
   * device gets the entire sequence at a lower frame rate rather than the
   * first third of it at full rate.
   *
   * It is a *download* cap. The separate memory cap below is a residency
   * cap, and on a phone it usually bites first: the device may be willing to
   * fetch eighty frames and only able to hold thirty of them at once.
   */
  constructor(basePath: string, variant: string, count: number, budget = count) {
    this.count = count;
    this.urls = Array.from(
      { length: count },
      (_, i) => `${basePath}/${variant}/${String(i).padStart(3, '0')}.webp`,
    );
    this.frames = Array.from({ length: count }, () => null);
    this.states = Array.from({ length: count }, () => 0 as FrameState);
    this.queue = subdivisionOrder(count).slice(0, Math.max(2, Math.min(budget, count)));
    this.allowed = new Set(this.queue);
    this.idleCount = this.allowed.size;

    const phone = isPhone();
    this.memoryBudget = phone ? MEMORY_BUDGET_PHONE : MEMORY_BUDGET_DESKTOP;
    // Decoding competes with scrolling for the main thread on a phone even
    // when it is nominally off it, and six parallel decodes during a flick is
    // what a dropped frame looks like.
    this.concurrency = phone ? 3 : 6;

    live.add(this);
    rebalance();
  }

  get isActive(): boolean {
    return this.active;
  }

  /** Decoded bytes per frame, measured from the first one to arrive. */
  get frameBytes(): number {
    return this.bytesPerFrame;
  }

  /** This device's whole-page allowance, in bytes. */
  get budgetBytes(): number {
    return this.memoryBudget;
  }

  /**
   * Says whether this sequence's layer is on screen.
   *
   * Called by the layer that owns it as it fades in and out. Going inactive
   * sheds almost everything immediately, which is what frees the allowance
   * for the layer taking over.
   */
  setActive(active: boolean): void {
    if (this.destroyed || active === this.active) return;
    this.active = active;
    rebalance();
  }

  /** Applies this sequence's share of the page allowance. Called by `rebalance`. */
  applyShare(shares: number, reservedBytes: number): void {
    if (this.bytesPerFrame === 0) return;
    const available = Math.max(0, this.memoryBudget - reservedBytes);
    this.maxResident = this.active
      ? Math.max(
          MIN_RESIDENT,
          Math.min(this.count, Math.floor(available / shares / this.bytesPerFrame)),
        )
      : SHED_RESIDENT;
    this.evict();
    this.pump();
  }

  /** Starts fetching. Safe to call more than once. */
  start(onChange?: (progress: SequenceProgress) => void): void {
    if (this.destroyed) return;
    if (onChange) this.onChange = onChange;
    this.pump();
  }

  /**
   * Moves a frame to the head of the queue, and records where the visitor is.
   *
   * Called every time the drawn position moves, so the queue continuously
   * re-sorts itself around wherever they actually are — and so does eviction,
   * which always takes from the end furthest away.
   */
  prioritise(index: number): void {
    if (this.destroyed) return;
    if (index < 0 || index >= this.count) return;

    const moved = index !== this.focus;
    this.focus = index;

    if (this.allowed.has(index) && this.states[index] === 0) {
      const at = this.queue.indexOf(index);
      if (at > 0) {
        this.queue.splice(at, 1);
        this.queue.unshift(index);
      }
    }
    // Pump on every move, not only when the focus frame itself is missing:
    // once the cache is full, whether a fetch may start depends on where the
    // visitor is, so a move can unblock a frame that was refused a moment ago.
    if (moved) this.pump();
  }

  /** The frame itself, or null if it has not arrived or has been released. */
  frame(index: number): Frame | null {
    if (this.states[index] !== 2) return null;
    return this.frames[index] ?? null;
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
  before(index: number, limit: number): { frame: Frame; index: number } | null {
    for (let i = Math.min(index, this.count - 1); i >= Math.max(0, index - limit); i -= 1) {
      const frame = this.frame(i);
      if (frame) return { frame, index: i };
    }
    return null;
  }

  /** The nearest loaded frame at or after `index`, within `limit` steps. */
  after(index: number, limit: number): { frame: Frame; index: number } | null {
    for (let i = Math.max(index, 0); i <= Math.min(this.count - 1, index + limit); i += 1) {
      const frame = this.frame(i);
      if (frame) return { frame, index: i };
    }
    return null;
  }

  /**
   * The closest frame we can actually draw.
   *
   * Searching outward rather than picking frame 0 is what makes a partial
   * sequence look like a low-frame-rate shot instead of a frozen one.
   */
  nearest(index: number): { frame: Frame; index: number } | null {
    const exact = this.frame(index);
    if (exact) return { frame: exact, index };

    for (let offset = 1; offset < this.count; offset += 1) {
      const a = index - offset >= 0 ? this.frame(index - offset) : null;
      if (a) return { frame: a, index: index - offset };
      const b = index + offset < this.count ? this.frame(index + offset) : null;
      if (b) return { frame: b, index: index + offset };
    }
    return null;
  }

  get progress(): SequenceProgress {
    return { loaded: this.loadedCount, total: this.allowed.size };
  }

  /** Resident frames and the bytes they hold — for the debug overlay. */
  get residency(): { frames: number; megabytes: number; cap: number } {
    return {
      frames: this.resident.length,
      megabytes: Math.round((this.resident.length * this.bytesPerFrame) / 1048576),
      cap: this.maxResident === Number.MAX_SAFE_INTEGER ? 0 : this.maxResident,
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.queue = [];
    this.onChange = null;
    for (let i = 0; i < this.count; i += 1) this.release(i);
    live.delete(this);
    rebalance();
  }

  /* ── Residency ─────────────────────────────────────────────────────────── */

  /**
   * Frees a decoded frame.
   *
   * `close()` on an ImageBitmap is a real deallocation, which is the entire
   * reason this class decodes to one. The `Image` fallback can only drop its
   * `src` and hope.
   */
  private release(index: number): void {
    const frame = this.frames[index];
    if (frame) {
      const source = frame.source;
      if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) source.close();
      else if (source instanceof HTMLImageElement) source.src = '';
    }
    this.frames[index] = null;
    if (this.states[index] === 2) this.loadedCount -= 1;
    // Back to idle, not failed: the file is in the HTTP cache, so scrolling
    // back re-decodes it without touching the network.
    if (this.states[index] !== 0 && this.allowed.has(index)) this.idleCount += 1;
    this.states[index] = 0;

    const at = this.resident.indexOf(index);
    if (at >= 0) this.resident.splice(at, 1);
  }

  /** Drops the frames furthest from where the visitor is, until under cap. */
  private evict(): void {
    while (this.resident.length > this.maxResident) {
      if (!this.dropFurthest(1)) return;
    }
  }

  /**
   * Releases the resident frame furthest from the focus, if it is further
   * away than `beyond`. Returns whether anything was freed.
   *
   * The distance test is what makes the cache a sliding window rather than a
   * fill-once buffer: a frame is only worth fetching if something further
   * from the visitor can be given up for it, and a frame within one step of
   * where they are looking is never given up at all.
   */
  private dropFurthest(beyond: number): boolean {
    let worst = -1;
    let distance = Math.max(1, beyond);
    for (const index of this.resident) {
      const d = Math.abs(index - this.focus);
      if (d > distance) {
        distance = d;
        worst = index;
      }
    }
    if (worst < 0) return false;
    this.release(worst);
    return true;
  }

  /* ── Loading ───────────────────────────────────────────────────────────── */

  private pump(): void {
    while (!this.destroyed && this.inFlight < this.concurrency) {
      const index = this.next();
      if (index === undefined) return;

      // A full cache does not stall the loader — it makes it choose. If
      // something resident is further from the visitor than the frame we
      // want, trade it; if not, this frame is not worth fetching yet, so put
      // it back and wait for the focus to move. (An earlier version simply
      // returned here, which deadlocked: nothing could load, so nothing could
      // be evicted, so nothing could ever load again.)
      if (this.resident.length + this.inFlight >= this.maxResident) {
        if (!this.dropFurthest(Math.abs(index - this.focus))) {
          this.queue.unshift(index);
          return;
        }
      }
      void this.load(index);
    }
  }

  /**
   * The next frame worth fetching.
   *
   * Skips anything already loaded or in flight — which, once eviction is in
   * play, includes frames that were loaded, released, and are now idle again,
   * so the queue has to be re-seeded rather than drained once.
   */
  private next(): number | undefined {
    if (this.idleCount <= 0) return undefined;
    while (this.queue.length > 0) {
      const index = this.queue.shift();
      if (index === undefined) return undefined;
      if (this.states[index] === 0) return index;
    }
    // The queue is spent. Re-seed around the focus with whatever is allowed
    // and currently unloaded, nearest first.
    const idle: number[] = [];
    for (const index of this.allowed) {
      if (this.states[index] === 0) idle.push(index);
    }
    if (idle.length === 0) return undefined;
    idle.sort((a, b) => Math.abs(a - this.focus) - Math.abs(b - this.focus));
    this.queue = idle;
    return this.queue.shift();
  }

  private async load(index: number): Promise<void> {
    const url = this.urls[index];
    if (!url) return;

    this.states[index] = 1;
    this.idleCount -= 1;
    this.inFlight += 1;

    try {
      const frame = await decodeFrame(url);
      if (this.destroyed || !frame) {
        if (frame && typeof ImageBitmap !== 'undefined' && frame.source instanceof ImageBitmap) {
          frame.source.close();
        }
        if (!this.destroyed) this.states[index] = 3;
        return; // stays out of idleCount: a frame that failed to decode is
        // not worth retrying on every scroll tick.
      }

      if (this.bytesPerFrame === 0) {
        this.bytesPerFrame = frame.width * frame.height * 4;
        rebalance();
      }

      this.frames[index] = frame;
      this.states[index] = 2;
      this.loadedCount += 1;
      this.resident.push(index);
      this.evict();
      this.onChange?.(this.progress);
    } catch {
      // A single missing frame is survivable — `nearest` simply skips it.
      this.states[index] = 3;
      this.frames[index] = null;
    } finally {
      this.inFlight -= 1;
      this.pump();
    }
  }
}

/**
 * Fetches and decodes one frame, off the main thread where possible.
 *
 * `fetch` with a low priority keeps the sequence from competing with the
 * fonts, the CSS and the poster, all of which the visitor is actually waiting
 * for. `createImageBitmap` then decodes without touching the main thread and
 * yields something that can be freed on demand.
 */
async function decodeFrame(url: string): Promise<Frame | null> {
  if (typeof createImageBitmap === 'function') {
    const response = await fetch(url, { priority: 'low' } as RequestInit);
    if (!response.ok) return null;
    const bitmap = await createImageBitmap(await response.blob());
    return { source: bitmap, width: bitmap.width, height: bitmap.height };
  }

  // Safari below 15 and a few old Androids. No deterministic free, but the
  // residency cap still drops the reference and the sizes involved are the
  // smaller phone cuts.
  const image = new Image();
  image.fetchPriority = 'low';
  image.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`frame ${url} failed`));
    image.src = url;
  });
  if (typeof image.decode === 'function') await image.decode().catch(() => undefined);
  return { source: image, width: image.naturalWidth, height: image.naturalHeight };
}

/**
 * Both ends, then midpoints, then midpoints of those: 0, 71, 35, 17, 53, …
 *
 * Every prefix of this order is a roughly even sample of the whole sequence,
 * which is the property that makes a half-loaded shot still look like a shot.
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
