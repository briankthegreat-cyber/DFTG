import { BufferGeometry, Mesh } from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

/**
 * three-mesh-bvh wiring for scalable raycast picking. Install is idempotent;
 * BVH build failures degrade gracefully to three's default raycasting.
 */

let installed = false;

export function installBvh(): void {
  if (installed) return;
  installed = true;
  const geometryProto = BufferGeometry.prototype as unknown as Record<string, unknown>;
  geometryProto['computeBoundsTree'] = computeBoundsTree;
  geometryProto['disposeBoundsTree'] = disposeBoundsTree;
  (Mesh.prototype as unknown as Record<string, unknown>)['raycast'] = acceleratedRaycast;
}

export function computeMeshBvh(mesh: Mesh): void {
  installBvh();
  try {
    const geometry = mesh.geometry as unknown as { computeBoundsTree?: () => void };
    geometry.computeBoundsTree?.();
  } catch {
    // Non-fatal: picking falls back to standard raycast for this mesh.
  }
}

export function disposeMeshBvh(mesh: Mesh): void {
  try {
    const geometry = mesh.geometry as unknown as { disposeBoundsTree?: () => void };
    geometry.disposeBoundsTree?.();
  } catch {
    // Already disposed or never built.
  }
}
