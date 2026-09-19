'use client';

/**
 * Decides whether this device gets the WebGL narrative or the 2D fallback.
 *
 * The rule from the brief is that a slow 3D site kills the pitch, so the
 * decision is made once at boot, before anything heavy is imported, and errs
 * towards the fallback. The fallback is not a punishment — it is a designed
 * scroll experience in its own right — so downgrading costs the visitor
 * nothing but a few megabytes they were not going to enjoy anyway.
 *
 * Nothing here touches the GPU beyond a throwaway context probe, and the whole
 * check runs in well under a millisecond.
 */

export type RenderMode = 'webgl' | 'fallback';

export interface DeviceProfile {
  readonly mode: RenderMode;
  /** Why we chose it — surfaced in the ?debug=1 overlay. */
  readonly reason: string;
  /** Rough capability band, used to scale particle counts and DPR. */
  readonly tier: 'high' | 'medium' | 'low';
  readonly maxDpr: number;
  readonly reducedMotion: boolean;
  readonly saveData: boolean;
}

const FALLBACK: Omit<DeviceProfile, 'reason'> = {
  mode: 'fallback',
  tier: 'low',
  maxDpr: 1,
  reducedMotion: false,
  saveData: false,
};

interface NetworkInformation {
  readonly effectiveType?: string;
  readonly saveData?: boolean;
}

function connection(): NetworkInformation | undefined {
  // `connection` is not in the DOM lib and is Chromium-only.
  const nav = navigator as Navigator & { connection?: NetworkInformation };
  return nav.connection;
}

/** A disposable probe: does WebGL2 exist, and what does the driver call itself? */
function probeRenderer(allowSoftware = false): { ok: boolean; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', {
      // Rejecting a software renderer is the point of the probe; the override
      // exists so the scene can still be forced on for a demo or a test.
      failIfMajorPerformanceCaveat: !allowSoftware,
    });
    if (!gl) return { ok: false, renderer: '' };

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? '')
      : String(gl.getParameter(gl.RENDERER) ?? '');

    // Release the context immediately; browsers cap how many may be live.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { ok: true, renderer };
  } catch {
    return { ok: false, renderer: '' };
  }
}

/** Software renderers advertise themselves. They cannot run this scene. */
const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|software|basic render|microsoft basic/i;

export function detectDeviceProfile(): DeviceProfile {
  if (typeof window === 'undefined') {
    return { ...FALLBACK, reason: 'server render' };
  }

  // Presenter and test overrides. `?webgl=force` runs the 3D scene on a
  // machine we would otherwise downgrade — useful on a demo laptop with an
  // unrecognised GPU, and the only way to exercise the WebGL path in a
  // headless browser. `?webgl=off` forces the fallback so both experiences
  // can be shown back to back.
  const override = new URLSearchParams(window.location.search).get('webgl');
  if (override === 'off') {
    return { ...FALLBACK, reason: 'forced off (?webgl=off)' };
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const net = connection();
  const saveData = net?.saveData === true;

  // Honoured absolutely. Someone who has asked their OS for less movement has
  // asked for less movement, not for a slightly calmer version of it.
  if (reducedMotion) {
    return { ...FALLBACK, reducedMotion: true, saveData, reason: 'prefers-reduced-motion' };
  }
  if (saveData) {
    return { ...FALLBACK, reducedMotion, saveData, reason: 'Save-Data requested' };
  }

  const effectiveType = net?.effectiveType ?? '';
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return { ...FALLBACK, reducedMotion, saveData, reason: `connection ${effectiveType}` };
  }

  // Chromium exposes an approximate RAM figure. 4GB and under is where the
  // particle work starts to stutter on real mid-range Androids.
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === 'number' && memory > 0 && memory <= 2) {
    return { ...FALLBACK, reducedMotion, saveData, reason: `deviceMemory ${memory}GB` };
  }

  const forced = override === 'force';
  const { ok, renderer } = probeRenderer(forced);
  if (!ok && !forced) {
    return { ...FALLBACK, reducedMotion, saveData, reason: 'no WebGL2' };
  }
  if (SOFTWARE_RENDERERS.test(renderer) && !forced) {
    return { ...FALLBACK, reducedMotion, saveData, reason: 'software renderer' };
  }

  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const lowMemory = typeof memory === 'number' && memory <= 4;
  const slowNetwork = effectiveType === '3g';

  const tier: DeviceProfile['tier'] =
    cores >= 8 && !lowMemory && !coarse ? 'high' : cores >= 4 && !lowMemory ? 'medium' : 'low';

  return {
    mode: 'webgl',
    tier,
    // Capped at 2 regardless: beyond that the fill cost doubles for a
    // difference nobody can see on a phone.
    maxDpr: tier === 'high' ? 2 : tier === 'medium' ? 1.75 : 1.5,
    reducedMotion,
    saveData,
    reason: `${forced ? 'forced · ' : ''}${tier} · ${cores} cores${memory ? ` · ${memory}GB` : ''}${slowNetwork ? ' · 3g' : ''}`,
  };
}

/** `?debug=1` turns on the FPS meter and the profile readout. */
export function debugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('debug') === '1';
}
