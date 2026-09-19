'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useImmersive } from '@/components/immersive/scroll-context';
import { BeanField } from '@/components/immersive/scenes/bean-field';

/**
 * The WebGL layer — the bean journey, and only the bean journey.
 *
 * The pour used to live here as procedural geometry and it has been retired in
 * favour of the filmed sequence, which is simply better: real crema, real
 * surface tension, real light. What is left is the thing film cannot do —
 * a field of beans drifting through actual depth, in front of and behind the
 * cup, responding to the scroll with parallax that a flat plate cannot fake.
 *
 * This canvas is transparent and sits directly over the pour, so the beans
 * pass in front of the coffee rather than beside it.
 *
 * Performance guards, all of them load-bearing:
 *  • DPR capped by device tier, never above 2.
 *  • Rendering stops entirely when the tab is hidden or the canvas scrolls
 *    out of view — a paused canvas costs nothing, and a phone's battery
 *    notices.
 *  • `powerPreference: 'high-performance'` and no antialias; the beans are
 *    soft-focus and MSAA would buy nothing for a third of the fill rate.
 */
export function ImmersiveStage() {
  const { profile, debug } = useImmersive();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [tabActive, setTabActive] = useState(true);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? true),
      { rootMargin: '10% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabActive(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const running = visible && tabActive;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      data-running={running}
    >
      <Canvas
        dpr={[1, profile.maxDpr]}
        frameloop={running ? 'always' : 'never'}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: true,
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 0, 5.2], fov: 42, near: 0.1, far: 60 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <SceneGraph tier={profile.tier} />
        {debug ? <FpsProbe /> : null}
      </Canvas>
    </div>
  );
}

/**
 * One `useFrame` for the whole layer: the camera reads the shared scroll ref
 * and the field moves itself.
 */
function SceneGraph({ tier }: { tier: 'high' | 'medium' | 'low' }) {
  const { progress } = useImmersive();

  /**
   * A slow pull-back through the bean chapter, so the field opens out rather
   * than simply scrolling past. Eased towards the target each frame instead of
   * snapped, so dragging the scroll bar quickly does not make the camera jump.
   */
  useFrame((state) => {
    const p = progress.current;
    const camera = state.camera;
    const beans = Math.min(1, Math.max(0, (p - 0.32) / 0.3));

    camera.position.x += (Math.sin(p * Math.PI * 1.6) * 0.5 - camera.position.x) * 0.06;
    camera.position.y += (beans * -0.4 - camera.position.y) * 0.06;
    camera.position.z += (5.2 - beans * 1.6 - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {/* Warm key from the left, matching both the photography and the film. */}
      <ambientLight intensity={0.65} />
      <directionalLight position={[-3, 4, 4]} intensity={1.7} color="#FFE6C7" />
      <directionalLight position={[3, 1, -2]} intensity={0.45} color="#9DB574" />

      <BeanField tier={tier} />
    </>
  );
}

/** FPS meter, behind ?debug=1. Writes to a DOM node rather than React state. */
function FpsProbe() {
  const { gl } = useThree();
  const frames = useRef(0);
  // Seeded on the first frame rather than during render: `performance.now()`
  // is impure and a render may happen more than once.
  const last = useRef(0);

  useFrame(() => {
    frames.current += 1;
    const now = performance.now();
    if (last.current === 0) last.current = now;
    if (now - last.current < 500) return;

    const fps = Math.round((frames.current * 1000) / (now - last.current));
    frames.current = 0;
    last.current = now;

    const node = document.getElementById('immersive-debug-fps');
    if (node) {
      const info = gl.info.render;
      node.textContent = `${fps} fps · ${info.calls} calls · ${info.triangles.toLocaleString()} tris`;
    }
  });

  return null;
}
