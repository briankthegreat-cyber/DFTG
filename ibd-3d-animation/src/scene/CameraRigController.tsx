import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { createCameraRig } from '@/ibd/camera-rig.ts';
import { player } from '@/store/player.ts';
import { captureFlags } from './capture.ts';
import { useSceneContext } from './scene-context.ts';

/** Drives the camera from the timeline; drag to orbit while paused, gentle parallax while playing. */
export function CameraRigController() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const { sceneState, options, fixedDelta, stageRef } = useSceneContext();
  const rig = useMemo(() => createCameraRig(camera), [camera]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || options.capture) return;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (e: PointerEvent) => {
      // Only drags that start on the 3D canvas orbit; drags on overlay controls (chapter strip, card) do not.
      if (e.button !== 0 || !(e.target instanceof HTMLCanvasElement)) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      if (dragging && !player.get().playing) {
        rig.orbitBy((e.clientX - lastX) / rect.width, (e.clientY - lastY) / rect.height);
      } else if (e.pointerType === 'mouse' && !player.get().reducedMotion) {
        rig.setParallax(nx, -ny);
      }
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => { dragging = false; };
    const onLeave = () => { dragging = false; rig.setParallax(0, 0); };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [rig, stageRef, options.capture]);

  useFrame((_, delta) => {
    const dt = options.capture ? fixedDelta : Math.min(delta, 0.05);
    const p = player.get();
    rig.update(sceneState.current.camera, dt, {
      immediate: captureFlags.immediate || p.reducedMotion,
      holdOrbit: !p.playing,
    });
  }, -5);
  return null;
}
