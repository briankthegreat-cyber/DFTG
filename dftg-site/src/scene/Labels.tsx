import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { createLabelOverlay } from '@/ibd/label-overlay.ts';
import type { LabelOverlay } from '@/ibd/label-overlay.ts';
import { captureFlags } from './capture.ts';
import { useSceneContext } from './scene-context.ts';

/**
 * Anatomy callouts. The DOM layer lives outside the canvas (App owns it); this
 * component only drives it from inside the render loop, where the camera lives.
 */
export function Labels({ container }: { container: HTMLElement | null }) {
  const { curves, sceneState, meshes, options, fixedDelta } = useSceneContext();
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const overlayRef = useRef<LabelOverlay | null>(null);

  useEffect(() => {
    if (!container) return;
    const overlay = createLabelOverlay({
      layer: container,
      curves,
      camera,
      occluders: () => Object.values(meshes.current),
      avoid: () => Array.from(document.querySelectorAll<HTMLElement>('[data-avoid-labels]')).map((el) => el.getBoundingClientRect()),
    });
    overlay.resize(size.width, size.height);
    overlayRef.current = overlay;
    return () => {
      overlay.dispose();
      overlayRef.current = null;
    };
    // size handled by the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, curves, camera, meshes]);

  useEffect(() => {
    overlayRef.current?.resize(size.width, size.height);
  }, [size.width, size.height]);

  useFrame((_, delta) => {
    const dt = captureFlags.immediate ? 1 : options.capture ? fixedDelta : Math.min(delta, 0.05);
    overlayRef.current?.update(sceneState.current, dt, options.labels);
    // Priority stays <= 0: a positive priority tells react-three-fiber we render manually.
  }, -1);

  return null;
}
