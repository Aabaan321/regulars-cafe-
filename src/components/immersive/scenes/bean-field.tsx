'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sectionProgress, useImmersive } from '@/components/immersive/scroll-context';

/**
 * THE BEAN JOURNEY.
 *
 * Beans drift through space along a scroll path with real depth — near ones
 * move faster and are larger, far ones hang back, which is what reads as
 * parallax without an actual depth-of-field pass (that costs a post-processing
 * chain and roughly a third of the frame budget on a phone, for an effect the
 * fog and size falloff approximate well enough here).
 *
 * Drawn as a single InstancedMesh: one draw call for the whole field, however
 * many beans. The count scales with the device tier — a low-tier phone gets a
 * third of what a desktop does and nobody can tell.
 */

const SECTION_START = 0.3;
const SECTION_END = 0.62;

const COUNT_BY_TIER = { high: 140, medium: 90, low: 48 } as const;

export function BeanField({ tier }: { tier: 'high' | 'medium' | 'low' }) {
  const { progress } = useImmersive();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = COUNT_BY_TIER[tier];

  /**
   * Fixed per-instance attributes, generated once from a seeded generator.
   *
   * Seeded rather than `Math.random`, for two reasons that both matter: a
   * render is allowed to happen more than once and must produce the same
   * field each time, and a scatter that is identical on every load is one
   * that can be art-directed — this particular seed puts no bean directly
   * over the cup's rim.
   */
  const beans = useMemo(() => {
    const random = mulberry32(0x5eed_c0ff);
    const data: BeanInstance[] = [];
    for (let i = 0; i < count; i += 1) {
      const depth = random();
      data.push({
        x: (random() - 0.5) * 9,
        y: (random() - 0.5) * 12,
        // Nearer beans sit in front of the cup, far ones well behind it.
        z: -6 + depth * 8,
        // Parallax: near beans travel further for the same scroll.
        speed: 0.5 + depth * 1.8,
        spin: (random() - 0.5) * 2.2,
        scale: 0.05 + depth * 0.1,
        phase: random() * Math.PI * 2,
      });
    }
    return data;
  }, [count]);

  /**
   * A bean: a squashed sphere. Eight segments rather than twelve — at the size
   * these render (a few dozen pixels, in motion, out of focus) the silhouette
   * is identical and it is 60% fewer triangles across the whole field.
   */
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 8, 6);
    g.scale(1, 0.72, 0.62);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#4A2716'),
        roughness: 0.78,
        metalness: 0.05,
      }),
    [],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const local = sectionProgress(progress.current, SECTION_START, SECTION_END);
    const time = state.clock.elapsedTime;

    // Fade the whole field in and out at the section edges, so beans do not
    // pop into existence in the middle of the pour. Read off the mesh rather
    // than off the memoised object: three.js owns the material once the mesh
    // has been constructed with it, and mutating a value React is holding is
    // exactly the aliasing bug `react-hooks/immutability` exists to catch.
    const fade = Math.sin(Math.PI * local);
    const surface = mesh.material as THREE.MeshStandardMaterial;
    mesh.visible = fade > 0.01;
    surface.opacity = fade;
    surface.transparent = fade < 0.98;

    if (!mesh.visible) return;

    for (let i = 0; i < beans.length; i += 1) {
      const bean = beans[i];
      if (!bean) continue;

      // Travel up the screen as the section advances; wrap for continuity.
      const travel = (bean.y + local * bean.speed * 14) % 14;
      const y = travel > 7 ? travel - 14 : travel;

      dummy.position.set(bean.x + Math.sin(time * 0.4 + bean.phase) * 0.25, y, bean.z);
      dummy.rotation.set(time * bean.spin * 0.3, time * bean.spin * 0.45, bean.phase);
      dummy.scale.setScalar(bean.scale * (0.8 + fade * 0.4));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} frustumCulled={false} />;
}

interface BeanInstance {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly speed: number;
  readonly spin: number;
  readonly scale: number;
  readonly phase: number;
}

/**
 * mulberry32 — 32 bits of state, uniform enough for scattering beans, and
 * about four lines. Anything stronger here would be a dependency bought to
 * decide where a coffee bean sits.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b_79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}
