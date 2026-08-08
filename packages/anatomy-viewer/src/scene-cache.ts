import type { Group, Mesh } from 'three';
import type { GeometryBinding } from '@anatomy/core';

/**
 * Three.js objects for loaded bundles live OUTSIDE React state — React and the
 * stores only ever hold stable IDs. Components subscribe to this cache for
 * mount/unmount and the EffectsController walks it to apply visual state.
 */
export interface LoadedBundleScene {
  bundleId: string;
  group: Group;
  meshesByGeometryId: Map<string, Mesh[]>;
  geometryIdsByStructureId: Map<string, string[]>;
  bindingsByGeometryId: Map<string, GeometryBinding>;
}

type Listener = () => void;

export class SceneCache {
  private bundles = new Map<string, LoadedBundleScene>();
  private listeners = new Set<Listener>();
  private version = 0;

  getVersion(): number {
    return this.version;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.version += 1;
    for (const listener of this.listeners) listener();
  }

  set(scene: LoadedBundleScene): void {
    this.bundles.set(scene.bundleId, scene);
    this.notify();
  }

  delete(bundleId: string): LoadedBundleScene | undefined {
    const scene = this.bundles.get(bundleId);
    if (scene) {
      this.bundles.delete(bundleId);
      this.notify();
    }
    return scene;
  }

  get(bundleId: string): LoadedBundleScene | undefined {
    return this.bundles.get(bundleId);
  }

  all(): LoadedBundleScene[] {
    return [...this.bundles.values()];
  }

  meshesForStructure(structureId: string): Mesh[] {
    const out: Mesh[] = [];
    for (const scene of this.bundles.values()) {
      const geometryIds = scene.geometryIdsByStructureId.get(structureId);
      if (!geometryIds) continue;
      for (const geometryId of geometryIds) {
        out.push(...(scene.meshesByGeometryId.get(geometryId) ?? []));
      }
    }
    return out;
  }

  *allMeshes(): IterableIterator<{ mesh: Mesh; binding: GeometryBinding; bundleId: string }> {
    for (const scene of this.bundles.values()) {
      for (const [geometryId, meshes] of scene.meshesByGeometryId) {
        const binding = scene.bindingsByGeometryId.get(geometryId);
        if (!binding) continue;
        for (const mesh of meshes) {
          yield { mesh, binding, bundleId: scene.bundleId };
        }
      }
    }
  }
}

/** Single viewer instance per app; keep the cache a module singleton. */
export const sceneCache = new SceneCache();
