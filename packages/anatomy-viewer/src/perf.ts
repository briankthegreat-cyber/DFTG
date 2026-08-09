/**
 * Development performance stats, published outside React state so per-frame
 * updates never re-render the tree. Consumers subscribe via useSyncExternalStore.
 */
export interface PerfStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  loadedBundles: number;
  lastEffectApplyMs: number;
  lastPickMs: number;
}

export const perfStats: PerfStats = {
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  loadedBundles: 0,
  lastEffectApplyMs: 0,
  lastPickMs: 0,
};

let version = 0;
const listeners = new Set<() => void>();

export function publishPerf(patch: Partial<PerfStats>): void {
  Object.assign(perfStats, patch);
  version += 1;
  for (const listener of listeners) listener();
}

export function subscribePerf(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPerfVersion(): number {
  return version;
}
