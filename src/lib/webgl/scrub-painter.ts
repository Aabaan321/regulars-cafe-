'use client';

import type { Frame, FrameSequence } from '@/lib/webgl/frame-sequence';

/**
 * Paints a scroll-scrubbed sequence onto a canvas.
 *
 * Shared by the home narrative and the site-wide plate, because the two were
 * drifting apart while doing the same two hard things — deciding *which*
 * frame, and making the change between frames not look like a slideshow.
 *
 * Two techniques do almost all of the work, and neither costs a byte:
 *
 * **Sub-frame cross-fading.** A sequence is a finite number of stills, so
 * scrubbing it by rounding to the nearest one is a step function: the picture
 * holds, jumps, holds. Instead the scroll position is kept as a *float* in
 * frame units and the two loaded frames either side of it are composited, the
 * second at the position's share of the distance between them. A 135-frame
 * sequence blended this way looks smoother than a 270-frame one that snaps,
 * at half the download — which is the better trade in every direction,
 * because frames cost bandwidth and blending costs one extra `drawImage` on a
 * compositor that was idle anyway.
 *
 * **An eased position.** `window.scrollY` is not smooth. A wheel notch is a
 * ~100px jump and a trackpad emits bursts, so a frame index derived straight
 * from it inherits every one of those steps. The drawn position instead
 * chases the scroll position exponentially, which both smooths the input and
 * lets the sequence carry on settling for a few hundred milliseconds after
 * the scroll stops — the thing that reads as "liquid" rather than "linked".
 *
 * The easing is per-millisecond, not per-frame. `p * 0.18` each rAF converges
 * at a rate that depends on the refresh rate, so the same page would glide on
 * a 60Hz panel and snap on a 120Hz one. Raising it to the elapsed time makes
 * the curve identical on both.
 *
 * How much easing is right depends entirely on what is feeding the position,
 * which is why the caller picks — see the two constants below.
 */

/**
 * For a position read straight from `window.scrollY`.
 *
 * Raw scroll is the steppy input this is here to fix: ~90% of the distance is
 * closed in 200ms, which absorbs a wheel notch without the background
 * noticeably trailing the page.
 */
export const SCRUB_EASE_RAW = 0.17;

/**
 * For a position that something else has already smoothed — on the narrative
 * page, Lenis, which interpolates the page scroll over about a second.
 *
 * Easing an already-eased signal does not smooth it twice; it only adds lag,
 * and a background that trails the text it sits behind by a fifth of a second
 * looks like a dropped frame rather than depth. This is near-instant and left
 * in only to absorb the occasional single-frame spike.
 */
export const SCRUB_EASE_SMOOTHED = 0.5;

/**
 * Backing-store resolution caps, as a multiple of CSS pixels.
 *
 * 2 is the usual ceiling — past that you pay double the fill rate for a
 * difference nobody has ever seen. A plate takes less than that again,
 * because it is *already soft*: the frames are built with a heavy focus
 * falloff and then sat under a veil, so a retina backing store is spent
 * resolving a blur. It halves the per-frame fill cost, which matters now that
 * every frame is two composited draws rather than one.
 */
export const SCRUB_DPR_HERO = 2;
export const SCRUB_DPR_PLATE = 1.25;

/**
 * Height change, in CSS pixels, below which the backing store is left alone.
 *
 * A phone's URL bar slides in and out as you scroll, and on iOS that resizes
 * a `position: fixed` layer by 60–100px repeatedly *during* the scroll. Every
 * one of those resizes reallocates the canvas, which clears it — so the
 * background flashed black on exactly the gesture it exists to respond to.
 *
 * The buffer is cover-drawn, so being a little taller than the element costs
 * nothing visible. 140px absorbs every mobile browser's chrome while still
 * reacting to a genuine layout change like a rotation or a desktop resize.
 */
const RESIZE_DEADBAND = 140;

/** Closer than this to the target, in frames, and it is simply there. */
const SNAP_EPSILON = 0.004;

/**
 * Blend steps between two frames. Far finer than anyone can see, and its only
 * job is to stop a scroll of one pixel triggering a full-canvas repaint.
 */
const BLEND_STEPS = 64;

/** Below this the second frame is invisible; above it the first one is. */
const BLEND_FLOOR = 1 / BLEND_STEPS;

export class ScrubPainter {
  private readonly context: CanvasRenderingContext2D;
  private position: number;
  private drawnKey = '';
  private painted = false;
  /** What is currently on the canvas, so a resize can put it back. */
  private lastPaint: {
    a: Frame;
    b: Frame | null;
    blend: number;
    scale: number;
  } | null = null;

  private readonly ease: number;
  private readonly maxDpr: number;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly sequence: FrameSequence,
    context: CanvasRenderingContext2D,
    options: {
      /** Start pinned here rather than easing in from frame 0. */
      readonly startProgress?: number;
      /** `SCRUB_EASE_RAW` or `SCRUB_EASE_SMOOTHED`, per the input. */
      readonly ease?: number;
      /** `SCRUB_DPR_HERO` or `SCRUB_DPR_PLATE`. */
      readonly maxDpr?: number;
    } = {},
  ) {
    this.context = context;
    this.position = (options.startProgress ?? 0) * (sequence.count - 1);
    this.ease = options.ease ?? SCRUB_EASE_RAW;
    this.maxDpr = options.maxDpr ?? SCRUB_DPR_HERO;
  }

  /** True once a real frame has been drawn, i.e. the canvas can be revealed. */
  get hasPainted(): boolean {
    return this.painted;
  }

  /**
   * Re-reads the backing store at the current device pixel ratio.
   *
   * Reallocating a canvas clears it, so this does as little of that as it can
   * get away with: a width change or a large height change only, and it
   * repaints the last frame synchronously rather than leaving the visitor a
   * blank rectangle until the next animation frame.
   */
  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    const cssWidth = this.canvas.clientWidth;
    const cssHeight = this.canvas.clientHeight;
    if (cssWidth <= 0 || cssHeight <= 0) return;

    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));

    const sameWidth = width === this.canvas.width;
    const closeEnough = Math.abs(height - this.canvas.height) < RESIZE_DEADBAND * dpr;
    if (sameWidth && closeEnough && this.painted) return;

    this.canvas.width = width;
    this.canvas.height = height;
    this.drawnKey = '';
    this.repaint();
  }

  /** Redraws the last composited pair into a freshly cleared buffer. */
  private repaint(): void {
    const last = this.lastPaint;
    if (!last) return;
    this.context.globalAlpha = 1;
    this.paint(last.a, last.scale);
    if (last.b && last.blend > BLEND_FLOOR) {
      this.context.globalAlpha = last.blend;
      this.paint(last.b, last.scale);
      this.context.globalAlpha = 1;
    }
  }

  /**
   * Advances toward `progress` (0–1) and paints if anything moved.
   *
   * `scale` is the slow push-in the caller applies over the shot; `deltaMs`
   * is the time since the last call, which is what keeps the easing
   * independent of refresh rate.
   */
  render(progress: number, scale: number, deltaMs: number): void {
    const last = this.sequence.count - 1;
    if (last < 0) return;

    const target = Math.min(1, Math.max(0, progress)) * last;

    // 1 - (1 - k)^n is the fraction of the gap closed by n frames of easing
    // at rate k, so raising it to the *fractional* number of elapsed frames
    // gives the same curve at any refresh rate.
    const frames = Math.min(4, Math.max(0, deltaMs) / 16.667);
    const k = 1 - (1 - this.ease) ** frames;
    this.position += (target - this.position) * k;
    if (Math.abs(target - this.position) < SNAP_EPSILON) this.position = target;

    /*
     * Whatever the visitor is heading for jumps the queue — the *target*,
     * not the eased position, so a fast flick fetches where the scroll is
     * going rather than where the picture has got to.
     */
    this.sequence.prioritise(Math.round(target));

    const pair = this.resolve(Math.min(last, Math.max(0, this.position)));
    if (!pair) return;

    const key = `${pair.aIndex}|${pair.bIndex}|${Math.round(pair.blend * BLEND_STEPS)}|${scale.toFixed(4)}`;
    if (key === this.drawnKey) return;
    this.drawnKey = key;

    this.lastPaint = { a: pair.a, b: pair.b, blend: pair.blend, scale };
    this.repaint();
    this.painted = true;
  }

  /**
   * The two images to composite, and how much of the second to use.
   *
   * The frames either side of `position` — but the nearest *loaded* ones,
   * not the adjacent indices, and that distinction is the whole trick.
   *
   * Frames arrive in binary-subdivision order and, on any device with a
   * reduced budget, only ever a subset arrives at all: a phone on 4G fetches
   * three fifths of them, spread evenly. Asking for `floor(position)` and
   * `floor(position) + 1` on such a device finds both loaded maybe a third of
   * the time, so the cross-fade quietly stops happening — precisely where it
   * matters most, because fewer frames is exactly what makes stepping
   * visible. Searching outward in each direction instead means a 42-frame
   * sequence blends across its real spacing and looks like a 119-frame one.
   *
   * `maxGap` is what keeps that honest. Early in the load only the two ends
   * exist, and dissolving the first frame of a pour into the last is not
   * smoothing, it is a double exposure. Allowing roughly three times the
   * expected spacing covers a fully-arrived budget with room to spare and
   * refuses anything wilder, which falls back to drawing one frame — a lower
   * frame rate, which is what a half-loaded sequence should look like.
   */
  private resolve(position: number): {
    a: Frame;
    aIndex: number;
    b: Frame | null;
    bIndex: number;
    blend: number;
  } | null {
    const gap = this.maxGap();
    const a = this.sequence.before(Math.floor(position), gap);
    const b = this.sequence.after(Math.ceil(position), gap);

    if (a && b && b.index > a.index) {
      return {
        a: a.frame,
        aIndex: a.index,
        b: b.frame,
        bIndex: b.index,
        blend: (position - a.index) / (b.index - a.index),
      };
    }
    const one = a ?? b;
    if (one) return { a: one.frame, aIndex: one.index, b: null, bIndex: -1, blend: 0 };

    const fallback = this.sequence.nearest(Math.round(position));
    if (!fallback) return null;
    return { a: fallback.frame, aIndex: fallback.index, b: null, bIndex: -1, blend: 0 };
  }

  /** Roughly three times the spacing this device's budget implies. */
  private maxGap(): number {
    const budget = Math.max(1, this.sequence.budget);
    return Math.max(2, Math.ceil(this.sequence.count / budget) * 3);
  }

  /** Cover-fits a frame into the backing store, centred, at `scale`. */
  private paint(frame: Frame, scale: number): void {
    const { width, height } = this.canvas;
    const cover = Math.max(width / frame.width, height / frame.height) * scale;
    const drawWidth = frame.width * cover;
    const drawHeight = frame.height * cover;
    this.context.drawImage(
      frame.source,
      (width - drawWidth) / 2,
      (height - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
  }
}
