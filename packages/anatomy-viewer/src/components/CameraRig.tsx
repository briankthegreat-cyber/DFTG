import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { sceneCache } from '../scene-cache';
import { useCameraStore, type CanonicalView } from '../state/camera';
import type { AnatomyAssetRegistry } from '../registry';

const VIEW_DIRECTIONS: Record<CanonicalView, Vector3> = {
  // Camera sits on this side of the subject, looking back at it.
  anterior: new Vector3(0, 0, 1),
  posterior: new Vector3(0, 0, -1),
  // +X is patient-left per the coordinate contract.
  left: new Vector3(1, 0, 0),
  right: new Vector3(-1, 0, 0),
  superior: new Vector3(0, 1, 0.001).normalize(),
  inferior: new Vector3(0, -1, 0.001).normalize(),
};

const FOCUS_DURATION_MS = 450;
const MIN_DISTANCE = 0.2;
const MAX_DISTANCE = 8;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function wholeSceneBounds(visibleOnly: boolean): Box3 | null {
  const box = new Box3();
  let any = false;
  for (const { mesh } of sceneCache.allMeshes()) {
    if (visibleOnly && !mesh.visible) continue;
    mesh.updateWorldMatrix(true, false);
    box.expandByObject(mesh);
    any = true;
  }
  return any && !box.isEmpty() ? box : null;
}

function fitDistance(box: Box3, fovDegrees: number): number {
  const sphereRadius = box.getSize(new Vector3()).length() / 2;
  const fov = (fovDegrees * Math.PI) / 180;
  const distance = (sphereRadius / Math.tan(fov / 2)) * 1.25;
  return Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE + 0.2, distance));
}

interface CameraRigProps {
  registry: AnatomyAssetRegistry;
  reducedMotion: boolean;
}

interface Animation {
  token: number;
  fromPos: Vector3;
  toPos: Vector3;
  fromTarget: Vector3;
  toTarget: Vector3;
  start: number;
  duration: number;
}

/**
 * Orbit/pan/zoom controls plus smooth, cancelable camera transitions for
 * focus-structure, canonical views, fit-visible, and reset requests.
 */
export function CameraRig({ registry, reducedMotion }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const request = useCameraStore((s) => s.request);
  const consume = useCameraStore((s) => s.consume);

  useEffect(() => {
    if (!request) return;
    const controls = controlsRef.current;
    if (!controls) return;

    let box: Box3 | null = null;
    let direction: Vector3 | null = null;
    switch (request.kind) {
      case 'focus-structure': {
        box = request.structureId ? registry.getStructureBounds(request.structureId) : null;
        break;
      }
      case 'view': {
        box = wholeSceneBounds(true) ?? wholeSceneBounds(false);
        direction = request.view ? VIEW_DIRECTIONS[request.view].clone() : null;
        break;
      }
      case 'fit-visible': {
        box = wholeSceneBounds(true);
        break;
      }
      case 'reset': {
        box = wholeSceneBounds(false);
        direction = VIEW_DIRECTIONS.anterior.clone();
        break;
      }
    }
    if (!box) {
      consume(request.token);
      return;
    }

    const center = box.getCenter(new Vector3());
    const distance = fitDistance(box, 'fov' in camera ? (camera as { fov: number }).fov : 45);
    if (!direction) {
      direction = camera.position.clone().sub(controls.target).normalize();
      if (direction.lengthSq() < 0.0001) direction = VIEW_DIRECTIONS.anterior.clone();
    }
    const toPos = center.clone().add(direction.multiplyScalar(distance));

    animationRef.current = {
      token: request.token,
      fromPos: camera.position.clone(),
      toPos,
      fromTarget: controls.target.clone(),
      toTarget: center,
      start: performance.now(),
      duration: reducedMotion ? 0 : FOCUS_DURATION_MS,
    };
    invalidate();
  }, [request, camera, consume, invalidate, reducedMotion, registry]);

  // Direct user input cancels any in-flight transition.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cancel = () => {
      const animation = animationRef.current;
      if (animation) {
        animationRef.current = null;
        consume(animation.token);
      }
    };
    controls.addEventListener('start', cancel);
    return () => controls.removeEventListener('start', cancel);
  }, [consume]);

  useFrame(() => {
    const animation = animationRef.current;
    const controls = controlsRef.current;
    if (!animation || !controls) return;
    const elapsed = performance.now() - animation.start;
    const t = animation.duration === 0 ? 1 : Math.min(1, elapsed / animation.duration);
    const eased = easeInOutCubic(t);
    camera.position.lerpVectors(animation.fromPos, animation.toPos, eased);
    controls.target.lerpVectors(animation.fromTarget, animation.toTarget, eased);
    controls.update();
    if (t >= 1) {
      animationRef.current = null;
      consume(animation.token);
    } else {
      invalidate();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping={false}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      target={[0, 1, 0]}
    />
  );
}
