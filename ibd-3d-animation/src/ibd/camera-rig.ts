// Smoothly follows the timeline camera while allowing gentle user orbiting.

import { MathUtils, Spherical, Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';
import { clamp } from './math-utils.ts';
import type { CameraState } from './timeline.ts';

const FOLLOW_RATE = 3.2; // higher = snappier
const ORBIT_DECAY = 1.6;
const MAX_YAW = 0.9;
const MAX_PITCH = 0.55;

export interface CameraRig {
  update(cameraState: CameraState, dt: number, opts?: { immediate?: boolean; holdOrbit?: boolean }): void;
  orbitBy(dx: number, dy: number): void;
  setParallax(nx: number, ny: number): void;
  readonly target: Vector3;
}

export function createCameraRig(camera: PerspectiveCamera): CameraRig {
  const position = new Vector3().copy(camera.position);
  const target = new Vector3();
  const desiredPosition = new Vector3();
  const desiredTarget = new Vector3();
  const offsetSpherical = new Spherical();
  const tmp = new Vector3();
  let fov = camera.fov;
  let yaw = 0;
  let pitch = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  let primed = false;

  function applyOrbit(base: Vector3, center: Vector3, out: Vector3): void {
    tmp.subVectors(base, center);
    offsetSpherical.setFromVector3(tmp);
    offsetSpherical.theta += yaw;
    offsetSpherical.phi = clamp(offsetSpherical.phi + pitch, 0.15, Math.PI - 0.15);
    out.setFromSpherical(offsetSpherical).add(center);
  }

  return {
    update(cameraState, dt, { immediate = false, holdOrbit = false } = {}) {
      desiredPosition.fromArray(cameraState.position);
      desiredTarget.fromArray(cameraState.target);
      if (!holdOrbit) {
        const decay = immediate ? 1 : 1 - Math.exp(-dt * ORBIT_DECAY);
        yaw = MathUtils.lerp(yaw, 0, decay);
        pitch = MathUtils.lerp(pitch, 0, decay);
      }
      const k = immediate || !primed ? 1 : 1 - Math.exp(-dt * FOLLOW_RATE);
      position.lerp(desiredPosition, k);
      target.lerp(desiredTarget, k);
      fov = MathUtils.lerp(fov, cameraState.fov, k);
      primed = true;

      applyOrbit(position, target, camera.position);
      tmp.copy(target);
      tmp.x += parallaxX;
      tmp.y += parallaxY;
      camera.lookAt(tmp);
      if (Math.abs(camera.fov - fov) > 1e-3) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    },
    orbitBy(dx, dy) {
      yaw = clamp(yaw - dx * 2.4, -MAX_YAW, MAX_YAW);
      pitch = clamp(pitch - dy * 1.6, -MAX_PITCH, MAX_PITCH);
    },
    setParallax(nx, ny) {
      parallaxX = nx * 0.18;
      parallaxY = ny * 0.12;
    },
    get target() {
      return target;
    },
  };
}
