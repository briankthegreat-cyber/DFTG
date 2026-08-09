import { Box3, Group, Mesh, Vector3, type Object3D } from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  BundleManifestSchema,
  MasterIndexSchema,
  isBindingAllowed,
  type BundleManifest,
  type GeometryBinding,
  type MasterIndex,
  type ReleasePolicy,
} from '@anatomy/core';
import { sceneCache, type LoadedBundleScene } from './scene-cache';
import { disposeEffects, registerMesh, setPickable } from './materials';
import { computeMeshBvh, disposeMeshBvh } from './bvh';
import type { BundleSnapshot, RegistryDiagnostic } from './state/registry-store';

/**
 * AnatomyAssetRegistry: manifest-driven, policy-gated bundle loading.
 *
 * Rules it enforces (see docs/ASSET_CONTRACT.md):
 * - Bundles are discovered from the master index, never hard-coded.
 * - A bundle manifest is validated before its GLB is fetched.
 * - A GLB whose nodes don't match the manifest bindings is REJECTED, never
 *   silently rendered.
 * - License-blocked bindings are filtered per release policy before their
 *   objects are exposed to the scene.
 * - Only stable IDs and minimal lookup keys are attached to Object3D.userData.
 */

export interface AnatomyUserData {
  geometryId: string;
  structureId: string;
  bundleId: string;
  system: string;
  selectable: boolean;
  nodeIndex: number;
  nodeName: string;
}

export class AssetLoadError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly diagnostic: RegistryDiagnostic,
  ) {
    super(diagnostic.message);
    this.name = 'AssetLoadError';
  }
}

export interface RegistryOptions {
  baseUrl: string;
  policy: ReleasePolicy;
  verifyHashes?: boolean;
  fetchFn?: typeof fetch;
  maxConcurrentGeometry?: number;
  onSnapshot?: (snapshot: BundleSnapshot) => void;
}

interface BundleRuntime {
  snapshot: BundleSnapshot;
  manifest?: BundleManifest;
  loadPromise?: Promise<void>;
  /**
   * Monotonic load generation. unloadBundle and each new request bump it; an
   * in-flight load whose generation is stale must never publish its scene or
   * emit 'ready' (it disposes what it built instead).
   */
  generation: number;
}

/** Dispose GPU-bound resources of a scene graph that never got registered. */
function disposeObjectTree(root: Object3D): void {
  root.traverse((object) => {
    if (object instanceof Mesh) {
      disposeMeshBvh(object);
      object.geometry.dispose();
      const material = object.material;
      for (const mat of Array.isArray(material) ? material : [material]) mat.dispose();
    }
  });
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class AnatomyAssetRegistry {
  index: MasterIndex | null = null;
  private bundles = new Map<string, BundleRuntime>();
  private geometryQueue: Array<() => void> = [];
  private activeGeometryLoads = 0;
  private readonly maxConcurrent: number;

  constructor(private readonly opts: RegistryOptions) {
    this.maxConcurrent = opts.maxConcurrentGeometry ?? 2;
  }

  get policy(): ReleasePolicy {
    return this.opts.policy;
  }

  private url(path: string): string {
    return `${this.opts.baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }

  private runtime(bundleId: string): BundleRuntime {
    let runtime = this.bundles.get(bundleId);
    if (!runtime) {
      runtime = {
        snapshot: { bundleId, state: 'notRequested', progress: 0, diagnostics: [] },
        generation: 0,
      };
      this.bundles.set(bundleId, runtime);
    }
    return runtime;
  }

  getSnapshot(bundleId: string): BundleSnapshot {
    return this.runtime(bundleId).snapshot;
  }

  getManifest(bundleId: string): BundleManifest | undefined {
    return this.bundles.get(bundleId)?.manifest;
  }

  private emit(bundleId: string, patch: Partial<BundleSnapshot>): void {
    const runtime = this.runtime(bundleId);
    runtime.snapshot = { ...runtime.snapshot, ...patch, bundleId };
    this.opts.onSnapshot?.(runtime.snapshot);
  }

  private async fetchJson(path: string, what: string): Promise<unknown> {
    const fetchFn = this.opts.fetchFn ?? fetch;
    let response: Response;
    try {
      response = await fetchFn(this.url(path));
    } catch (cause) {
      throw new AssetLoadError(`Could not reach the anatomy asset server.`, {
        severity: 'error',
        code: 'fetch_failed',
        message: `fetching ${what} at ${path}: ${String(cause)}`,
      });
    }
    if (!response.ok) {
      throw new AssetLoadError(`The ${what} could not be downloaded (HTTP ${response.status}).`, {
        severity: 'error',
        code: 'fetch_http_error',
        message: `HTTP ${response.status} for ${path}`,
        expected: '200',
        actual: String(response.status),
      });
    }
    try {
      return await response.json();
    } catch (cause) {
      throw new AssetLoadError(`The ${what} is not valid JSON.`, {
        severity: 'error',
        code: 'json_parse_error',
        message: `parsing ${what} at ${path}: ${String(cause)}`,
      });
    }
  }

  async loadMasterIndex(): Promise<MasterIndex> {
    const raw = await this.fetchJson('index.json', 'anatomy index');
    const parsed = MasterIndexSchema.safeParse(raw);
    if (!parsed.success) {
      throw new AssetLoadError('The anatomy index failed validation.', {
        severity: 'error',
        code: 'index_schema_error',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
    }
    this.index = parsed.data;
    return parsed.data;
  }

  async loadBundleManifest(bundleId: string): Promise<BundleManifest> {
    const runtime = this.runtime(bundleId);
    if (runtime.manifest) return runtime.manifest;
    if (!this.index) await this.loadMasterIndex();
    const entry = this.index?.bundles.find((b) => b.bundle_id === bundleId);
    if (!entry) {
      throw new AssetLoadError(`Unknown bundle "${bundleId}".`, {
        severity: 'error',
        code: 'unknown_bundle',
        message: `bundle "${bundleId}" is not present in the master index`,
        bundle_id: bundleId,
      });
    }
    // NOTE: no snapshot state change here — manifests are also prefetched for
    // ontology/search metadata without requesting geometry; only requestBundle
    // drives the load state machine.
    const raw = await this.fetchJson(entry.manifest_path, `bundle manifest (${bundleId})`);
    const parsed = BundleManifestSchema.safeParse(raw);
    if (!parsed.success) {
      throw new AssetLoadError(`The manifest for "${bundleId}" failed validation.`, {
        severity: 'error',
        code: 'manifest_schema_error',
        bundle_id: bundleId,
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
    }
    const manifest = parsed.data;
    if (manifest.bundle_id !== bundleId) {
      throw new AssetLoadError(`Bundle manifest identity mismatch.`, {
        severity: 'error',
        code: 'manifest_identity_mismatch',
        bundle_id: bundleId,
        message: `manifest at ${entry.manifest_path} declares bundle_id "${manifest.bundle_id}"`,
        expected: bundleId,
        actual: manifest.bundle_id,
      });
    }
    if (manifest.system !== entry.system) {
      throw new AssetLoadError(`Bundle system mismatch for "${bundleId}".`, {
        severity: 'error',
        code: 'manifest_system_mismatch',
        bundle_id: bundleId,
        expected: entry.system,
        actual: manifest.system,
        message: `index says system "${entry.system}", manifest says "${manifest.system}"`,
      });
    }
    runtime.manifest = manifest;
    return manifest;
  }

  /** Load every bundle manifest (small JSON) so ontology/search know all bindings. */
  async loadAllManifests(): Promise<BundleManifest[]> {
    if (!this.index) await this.loadMasterIndex();
    const bundles = this.index?.bundles ?? [];
    const results: BundleManifest[] = [];
    for (const entry of bundles) {
      results.push(await this.loadBundleManifest(entry.bundle_id));
    }
    return results;
  }

  /** Request bundle geometry; concurrency-limited, idempotent while in flight. */
  requestBundle(bundleId: string): Promise<void> {
    const runtime = this.runtime(bundleId);
    const state = runtime.snapshot.state;
    if (state === 'ready') return Promise.resolve();
    if (runtime.loadPromise && state !== 'error' && state !== 'disposed') {
      return runtime.loadPromise;
    }
    this.emit(bundleId, { state: 'queued', progress: 0 });
    runtime.generation += 1;
    const generation = runtime.generation;
    runtime.loadPromise = new Promise<void>((resolve) => {
      const start = () => {
        this.activeGeometryLoads += 1;
        void this.loadBundleGeometry(bundleId, generation)
          .catch((error: unknown) => {
            // A load superseded by unload/re-request must not publish errors.
            if (this.runtime(bundleId).generation !== generation) return;
            const diagnostic: RegistryDiagnostic =
              error instanceof AssetLoadError
                ? error.diagnostic
                : {
                    severity: 'error',
                    code: 'bundle_load_failed',
                    message: String(error),
                    bundle_id: bundleId,
                  };
            const userMessage =
              error instanceof AssetLoadError
                ? error.userMessage
                : 'This system could not be loaded. Try again.';
            this.emit(bundleId, {
              state: 'error',
              userMessage,
              diagnostics: [...this.runtime(bundleId).snapshot.diagnostics, diagnostic],
            });
          })
          .finally(() => {
            this.activeGeometryLoads -= 1;
            const next = this.geometryQueue.shift();
            if (next) next();
            resolve();
          });
      };
      if (this.activeGeometryLoads < this.maxConcurrent) start();
      else this.geometryQueue.push(start);
    });
    return runtime.loadPromise;
  }

  private async fetchGlb(
    manifest: BundleManifest,
    isStale: () => boolean = () => false,
  ): Promise<ArrayBuffer> {
    const fetchFn = this.opts.fetchFn ?? fetch;
    const entry = this.index?.bundles.find((b) => b.bundle_id === manifest.bundle_id);
    const assetUrl = this.url(
      `${entry ? entry.manifest_path.replace(/[^/]+$/, '') : ''}${manifest.asset_path}`,
    );
    const response = await fetchFn(assetUrl);
    if (!response.ok || !response.body) {
      throw new AssetLoadError(`Geometry for "${manifest.bundle_id}" could not be downloaded.`, {
        severity: 'error',
        code: 'glb_fetch_error',
        bundle_id: manifest.bundle_id,
        message: `HTTP ${response.status} for ${assetUrl}`,
      });
    }
    const total =
      Number(response.headers.get('content-length') ?? 0) || manifest.asset_byte_length || 0;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.byteLength;
        if (total > 0 && !isStale()) {
          this.emit(manifest.bundle_id, { progress: Math.min(0.95, received / total) });
        }
      }
    }
    const buffer = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return buffer.buffer;
  }

  private async loadBundleGeometry(bundleId: string, generation: number): Promise<void> {
    const isStale = () => this.runtime(bundleId).generation !== generation;

    this.emit(bundleId, { state: 'loadingManifest' });
    const manifest = await this.loadBundleManifest(bundleId);
    if (isStale()) return;
    this.emit(bundleId, { state: 'loadingGeometry', progress: 0 });

    const buffer = await this.fetchGlb(manifest, isStale);
    if (isStale()) return;

    if (this.opts.verifyHashes && manifest.asset_sha256) {
      const actual = await sha256Hex(buffer);
      if (isStale()) return;
      if (actual !== manifest.asset_sha256) {
        throw new AssetLoadError(
          `Geometry for "${bundleId}" failed integrity verification and was not loaded.`,
          {
            severity: 'error',
            code: 'glb_hash_mismatch',
            bundle_id: bundleId,
            expected: manifest.asset_sha256,
            actual,
            message: 'SHA-256 of downloaded GLB does not match the manifest',
          },
        );
      }
    }

    const gltf = await new Promise<GLTF>((resolve, reject) => {
      new GLTFLoader().parse(buffer, '', resolve, (error) => reject(error));
    });
    if (isStale()) {
      disposeObjectTree(gltf.scene);
      return;
    }

    const scene = this.mapBindings(manifest, gltf);
    if (isStale()) {
      disposeObjectTree(scene.group);
      return;
    }
    sceneCache.set(scene);

    let triangleCount = 0;
    let meshCount = 0;
    for (const meshes of scene.meshesByGeometryId.values()) {
      for (const mesh of meshes) {
        meshCount += 1;
        const indexAttr = mesh.geometry.getIndex();
        triangleCount +=
          (indexAttr ? indexAttr.count : (mesh.geometry.attributes['position']?.count ?? 0)) / 3;
      }
    }

    this.emit(bundleId, {
      state: 'ready',
      progress: 1,
      stats: {
        meshCount,
        triangleCount: Math.round(triangleCount),
        byteLength: buffer.byteLength,
        excludedByLicense: manifest.bindings.filter((b) => !isBindingAllowed(b, this.opts.policy))
          .length,
      },
    });
  }

  private mapBindings(manifest: BundleManifest, gltf: GLTF): LoadedBundleScene {
    const diagnostics: RegistryDiagnostic[] = [];
    const nodeByIndex = new Map<number, Object3D>();
    const nodeObjects = new Set<Object3D>();

    gltf.parser.associations.forEach((reference, object) => {
      const nodeIndex = (reference as { nodes?: number } | undefined)?.nodes;
      if (typeof nodeIndex === 'number' && 'isObject3D' in object) {
        nodeByIndex.set(nodeIndex, object as Object3D);
        nodeObjects.add(object as Object3D);
      }
    });

    const meshesByGeometryId = new Map<string, Mesh[]>();
    const geometryIdsByStructureId = new Map<string, string[]>();
    const bindingsByGeometryId = new Map<string, GeometryBinding>();

    for (const binding of manifest.bindings) {
      if (!isBindingAllowed(binding, this.opts.policy)) {
        // License gate: remove blocked geometry from the scene graph entirely.
        const blockedObject = nodeByIndex.get(binding.gltf_node.index);
        blockedObject?.removeFromParent();
        diagnostics.push({
          severity: 'info',
          code: 'license_excluded',
          bundle_id: manifest.bundle_id,
          message: `geometry "${binding.geometry_id}" excluded by policy "${this.opts.policy}" (license: ${binding.license.status})`,
        });
        continue;
      }

      const object = nodeByIndex.get(binding.gltf_node.index);
      if (!object) {
        diagnostics.push({
          severity: 'error',
          code: 'node_index_missing',
          bundle_id: manifest.bundle_id,
          message: `binding "${binding.geometry_id}" references glTF node ${binding.gltf_node.index}, which was not produced by the loader`,
          expected: `node ${binding.gltf_node.index} ("${binding.gltf_node.name}")`,
          actual: 'missing',
        });
        continue;
      }
      if (object.name !== binding.gltf_node.name) {
        diagnostics.push({
          severity: 'error',
          code: 'node_name_mismatch',
          bundle_id: manifest.bundle_id,
          message: `binding "${binding.geometry_id}" expected node name "${binding.gltf_node.name}"`,
          expected: binding.gltf_node.name,
          actual: object.name,
        });
        continue;
      }

      const meshes: Mesh[] =
        object instanceof Mesh
          ? [object]
          : (object.children.filter(
              (child) => child instanceof Mesh && !nodeObjects.has(child),
            ) as Mesh[]);
      if (meshes.length === 0) {
        diagnostics.push({
          severity: 'error',
          code: 'node_has_no_mesh',
          bundle_id: manifest.bundle_id,
          message: `binding "${binding.geometry_id}" maps to node "${binding.gltf_node.name}" which has no mesh primitives`,
        });
        continue;
      }

      for (const mesh of meshes) {
        const userData: AnatomyUserData = {
          geometryId: binding.geometry_id,
          structureId: binding.structure_id,
          bundleId: manifest.bundle_id,
          system: binding.system,
          selectable: binding.selectable,
          nodeIndex: binding.gltf_node.index,
          nodeName: binding.gltf_node.name,
        };
        mesh.userData['anatomy'] = userData;
        registerMesh(mesh);
        setPickable(mesh, binding.selectable);
        computeMeshBvh(mesh);
      }

      meshesByGeometryId.set(binding.geometry_id, meshes);
      bindingsByGeometryId.set(binding.geometry_id, binding);
      const list = geometryIdsByStructureId.get(binding.structure_id) ?? [];
      list.push(binding.geometry_id);
      geometryIdsByStructureId.set(binding.structure_id, list);
    }

    // Every rendered mesh must be accounted for by a binding: a GLB carrying
    // geometry the manifest doesn't describe would otherwise bypass the
    // license gate, visibility rules, and disposal. Reject the bundle.
    gltf.scene.traverse((object) => {
      if (object instanceof Mesh && object.userData['anatomy'] === undefined) {
        diagnostics.push({
          severity: 'error',
          code: 'unbound_mesh_node',
          bundle_id: manifest.bundle_id,
          message: `glTF object "${object.name || '(unnamed)'}" carries mesh geometry but has no manifest binding`,
        });
      }
    });

    const errors = diagnostics.filter((d) => d.severity === 'error');
    this.emit(manifest.bundle_id, {
      diagnostics: [...this.runtime(manifest.bundle_id).snapshot.diagnostics, ...diagnostics],
    });
    if (errors.length > 0) {
      // Never silently render a mismatched GLB/manifest pair.
      throw new AssetLoadError(
        `Geometry for "${manifest.bundle_id}" does not match its manifest and was not loaded.`,
        {
          severity: 'error',
          code: 'binding_mismatch',
          bundle_id: manifest.bundle_id,
          message: errors.map((e) => e.message).join('; '),
        },
      );
    }

    const group = new Group();
    group.name = `bundle:${manifest.bundle_id}`;
    group.add(gltf.scene);

    return {
      bundleId: manifest.bundle_id,
      group,
      meshesByGeometryId,
      geometryIdsByStructureId,
      bindingsByGeometryId,
    };
  }

  unloadBundle(bundleId: string): void {
    const scene = sceneCache.delete(bundleId);
    if (scene) {
      for (const meshes of scene.meshesByGeometryId.values()) {
        for (const mesh of meshes) {
          disposeEffects(mesh);
          disposeMeshBvh(mesh);
          mesh.geometry.dispose();
          const material = mesh.material;
          for (const mat of Array.isArray(material) ? material : [material]) mat.dispose();
        }
      }
    }
    const runtime = this.runtime(bundleId);
    runtime.loadPromise = undefined;
    // Invalidate any in-flight load so it cannot resurrect the bundle.
    runtime.generation += 1;
    this.emit(bundleId, { state: 'disposed', progress: 0 });
  }

  /** Aggregate world bounds for a structure: manifest bounds first, live meshes as fallback. */
  getStructureBounds(structureId: string): Box3 | null {
    const box = new Box3();
    let hasManifestBounds = false;
    for (const runtime of this.bundles.values()) {
      const manifest = runtime.manifest;
      if (!manifest) continue;
      for (const binding of manifest.bindings) {
        if (binding.structure_id !== structureId || !binding.world_bounds_m) continue;
        const { min, max } = binding.world_bounds_m;
        box.expandByPoint(new Vector3(min[0], min[1], min[2]));
        box.expandByPoint(new Vector3(max[0], max[1], max[2]));
        hasManifestBounds = true;
      }
    }
    if (hasManifestBounds) return box;
    const meshes = sceneCache.meshesForStructure(structureId);
    if (meshes.length === 0) return null;
    for (const mesh of meshes) box.expandByObject(mesh);
    return box.isEmpty() ? null : box;
  }
}
