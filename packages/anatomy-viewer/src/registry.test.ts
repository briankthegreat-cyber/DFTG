import { beforeEach, describe, expect, it } from 'vitest';
import { buildGlbBytes } from '@anatomy/asset-tools';
import { makeBinding, makeManifest, type BundleManifest, type MasterIndex } from '@anatomy/core';
import { AnatomyAssetRegistry } from './registry';
import { sceneCache } from './scene-cache';
import { applyEffectState, PRISTINE_EFFECT } from './materials';
import type { BundleSnapshot } from './state/registry-store';

/**
 * Round-trip: asset-tools GLB writer -> real GLTFLoader parse -> registry
 * node/binding mapping. Covers multi-node structures, multi-primitive nodes,
 * mismatch rejection, license filtering and unload disposal.
 */

const GLB = buildGlbBytes({
  rootNodeName: 'TEST-ORG',
  generator: 'registry-test',
  nodes: [
    {
      name: 'TEST-G-A',
      primitives: [{ box: { center: [0, 1, 0], size: [0.2, 0.2, 0.2] }, colorHex: '#cfc6b8' }],
    },
    {
      name: 'TEST-G-B1',
      primitives: [{ box: { center: [0.3, 1.2, 0], size: [0.1, 0.3, 0.1] }, colorHex: '#c9c0b2' }],
    },
    {
      name: 'TEST-G-B2',
      primitives: [{ box: { center: [0.3, 0.8, 0], size: [0.1, 0.3, 0.1] }, colorHex: '#c9c0b2' }],
    },
    {
      name: 'TEST-G-PLATE',
      primitives: [
        { box: { center: [0, 0.01, 0], size: [0.6, 0.02, 0.4] }, colorHex: '#6b7280' },
        { box: { center: [0, 0.03, 0.18], size: [0.6, 0.02, 0.03] }, colorHex: '#8b93a3' },
      ],
    },
  ],
});

function binding(geometryId: string, structureId: string, nodeIndex: number, extra = {}) {
  return makeBinding({
    geometry_id: geometryId,
    structure_id: structureId,
    canonical_name: structureId,
    gltf_node: { index: nodeIndex, name: geometryId, mesh_index: nodeIndex - 1 },
    world_bounds_m: { min: [-1, 0, -1], max: [1, 2, 1] },
    ...extra,
  });
}

function goodManifest(): BundleManifest {
  return makeManifest({
    bundle_id: 'test-bundle',
    bindings: [
      binding('TEST-G-A', 'TEST-S-A', 1),
      binding('TEST-G-B1', 'TEST-S-B', 2),
      binding('TEST-G-B2', 'TEST-S-B', 3),
      binding('TEST-G-PLATE', 'TEST-S-P', 4),
    ],
  });
}

const INDEX: MasterIndex = {
  schema_version: '1.1.0',
  generated_at: '2026-08-08T00:00:00Z',
  coordinate_system_id: 'ANAT_CANONICAL_LSA_YUP_M_V1_1',
  release_stage: 'development_fixture',
  ontology_path: 'ontology/structures.json',
  education_path: 'education/records.json',
  lessons_path: 'education/lessons.json',
  quiz_path: 'education/quiz-questions.json',
  bundles: [
    {
      bundle_id: 'test-bundle',
      system: 'test_system',
      display_name: 'Test Bundle',
      manifest_path: 'bundles/test/manifest.json',
      development_fixture: true,
      initial: true,
    },
  ],
};

function makeFetch(manifest: BundleManifest): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('index.json')) return Response.json(INDEX);
    if (url.endsWith('manifest.json')) return Response.json(manifest);
    if (url.endsWith('model.glb')) {
      return new Response(new Uint8Array(GLB), {
        headers: { 'content-length': String(GLB.byteLength) },
      });
    }
    return new Response('not found', { status: 404 });
  }) as typeof fetch;
}

function makeRegistry(manifest: BundleManifest, policy = 'internal_development' as const) {
  const snapshots: BundleSnapshot[] = [];
  const registry = new AnatomyAssetRegistry({
    baseUrl: 'https://assets.test/anatomy',
    policy,
    fetchFn: makeFetch(manifest),
    onSnapshot: (snapshot) => snapshots.push(snapshot),
  });
  return { registry, snapshots };
}

beforeEach(() => {
  sceneCache.delete('test-bundle');
});

describe('AnatomyAssetRegistry', () => {
  it('maps glTF nodes to bindings with stable IDs in userData', async () => {
    const { registry, snapshots } = makeRegistry(goodManifest());
    await registry.requestBundle('test-bundle');

    expect(registry.getSnapshot('test-bundle').state).toBe('ready');
    const scene = sceneCache.get('test-bundle');
    expect(scene).toBeDefined();
    if (!scene) return;

    const meshesA = scene.meshesByGeometryId.get('TEST-G-A');
    expect(meshesA).toHaveLength(1);
    expect(meshesA?.[0]?.userData['anatomy']).toMatchObject({
      geometryId: 'TEST-G-A',
      structureId: 'TEST-S-A',
      bundleId: 'test-bundle',
      selectable: true,
    });

    // Bundle states progressed through the documented lifecycle.
    const states = snapshots.map((s) => s.state);
    expect(states).toContain('queued');
    expect(states).toContain('loadingGeometry');
    expect(states[states.length - 1]).toBe('ready');
  });

  it('groups a multi-node structure under one structure_id', async () => {
    const { registry } = makeRegistry(goodManifest());
    await registry.requestBundle('test-bundle');
    const scene = sceneCache.get('test-bundle');
    expect(scene?.geometryIdsByStructureId.get('TEST-S-B')).toEqual(['TEST-G-B1', 'TEST-G-B2']);

    // Hiding the structure hides every mesh of the group; revert restores both.
    const meshes = sceneCache.meshesForStructure('TEST-S-B');
    expect(meshes).toHaveLength(2);
    for (const mesh of meshes) applyEffectState(mesh, { ...PRISTINE_EFFECT, hidden: true });
    expect(meshes.every((m) => !m.visible)).toBe(true);
    for (const mesh of meshes) applyEffectState(mesh, PRISTINE_EFFECT);
    expect(meshes.every((m) => m.visible)).toBe(true);
  });

  it('maps a multi-primitive node to multiple meshes of one geometry_id', async () => {
    const { registry } = makeRegistry(goodManifest());
    await registry.requestBundle('test-bundle');
    const scene = sceneCache.get('test-bundle');
    const plateMeshes = scene?.meshesByGeometryId.get('TEST-G-PLATE');
    expect(plateMeshes).toHaveLength(2);
    const materials = plateMeshes?.map((m) => m.material);
    expect(materials?.[0]).not.toBe(materials?.[1]);
  });

  it('rejects a GLB whose node names do not match the manifest', async () => {
    const bad = goodManifest();
    const firstBinding = bad.bindings[0];
    if (!firstBinding) throw new Error('manifest fixture broken');
    firstBinding.gltf_node = { ...firstBinding.gltf_node, name: 'WRONG-NAME' };
    const { registry } = makeRegistry(bad);
    await registry.requestBundle('test-bundle');

    const snapshot = registry.getSnapshot('test-bundle');
    expect(snapshot.state).toBe('error');
    expect(snapshot.diagnostics.some((d) => d.code === 'node_name_mismatch')).toBe(true);
    expect(sceneCache.get('test-bundle')).toBeUndefined();
  });

  it('excludes license-blocked bindings under external policy without failing the bundle', async () => {
    const manifest = goodManifest();
    const blocked = manifest.bindings[0];
    if (!blocked) throw new Error('manifest fixture broken');
    blocked.license = {
      status: 'blocked_distribution',
      allowed_policies: ['internal_development'],
    };
    const { registry } = makeRegistry(manifest, 'external_preview' as never);
    await registry.requestBundle('test-bundle');

    const snapshot = registry.getSnapshot('test-bundle');
    expect(snapshot.state).toBe('ready');
    expect(snapshot.stats?.excludedByLicense).toBe(1);
    const scene = sceneCache.get('test-bundle');
    expect(scene?.meshesByGeometryId.has('TEST-G-A')).toBe(false);
    expect(scene?.geometryIdsByStructureId.has('TEST-S-A')).toBe(false);
    expect(scene?.meshesByGeometryId.has('TEST-G-B1')).toBe(true);
  });

  it('unloads and disposes a bundle', async () => {
    const { registry } = makeRegistry(goodManifest());
    await registry.requestBundle('test-bundle');
    expect(sceneCache.get('test-bundle')).toBeDefined();
    registry.unloadBundle('test-bundle');
    expect(sceneCache.get('test-bundle')).toBeUndefined();
    expect(registry.getSnapshot('test-bundle').state).toBe('disposed');
  });

  it('rejects a GLB carrying mesh nodes the manifest does not bind', async () => {
    // Manifest omits TEST-G-PLATE: its bytes would render outside the
    // license/visibility gates, so the bundle must be rejected.
    const partial = makeManifest({
      bundle_id: 'test-bundle',
      bindings: [
        binding('TEST-G-A', 'TEST-S-A', 1),
        binding('TEST-G-B1', 'TEST-S-B', 2),
        binding('TEST-G-B2', 'TEST-S-B', 3),
      ],
    });
    const { registry } = makeRegistry(partial);
    await registry.requestBundle('test-bundle');

    const snapshot = registry.getSnapshot('test-bundle');
    expect(snapshot.state).toBe('error');
    expect(snapshot.diagnostics.some((d) => d.code === 'unbound_mesh_node')).toBe(true);
    expect(sceneCache.get('test-bundle')).toBeUndefined();
  });

  it('unloadBundle during an in-flight load wins: no resurrection, no duplicate scene', async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let glbFetches = 0;
    const manifest = goodManifest();
    const snapshots: BundleSnapshot[] = [];
    const registry = new AnatomyAssetRegistry({
      baseUrl: 'https://assets.test/anatomy',
      policy: 'internal_development',
      onSnapshot: (snapshot) => snapshots.push(snapshot),
      fetchFn: (async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('index.json')) return Response.json(INDEX);
        if (url.endsWith('manifest.json')) return Response.json(manifest);
        if (url.endsWith('model.glb')) {
          glbFetches += 1;
          if (glbFetches === 1) await gate; // hold the first load in flight
          return new Response(new Uint8Array(GLB));
        }
        return new Response('not found', { status: 404 });
      }) as typeof fetch,
    });

    const firstLoad = registry.requestBundle('test-bundle');
    await new Promise((resolve) => setTimeout(resolve, 20)); // reach the gated fetch
    registry.unloadBundle('test-bundle');

    // Re-request while the superseded load is still in flight.
    const secondLoad = registry.requestBundle('test-bundle');
    release?.();
    await Promise.all([firstLoad, secondLoad]);

    expect(registry.getSnapshot('test-bundle').state).toBe('ready');
    expect(sceneCache.get('test-bundle')).toBeDefined();
    // The superseded load must never have published: exactly one 'ready'.
    expect(snapshots.filter((s) => s.state === 'ready')).toHaveLength(1);

    // And unload with NO re-request stays disposed even after the gate opens.
    registry.unloadBundle('test-bundle');
    expect(registry.getSnapshot('test-bundle').state).toBe('disposed');
    expect(sceneCache.get('test-bundle')).toBeUndefined();
  });

  it('provides structure bounds from manifest world bounds', async () => {
    const { registry } = makeRegistry(goodManifest());
    await registry.requestBundle('test-bundle');
    const bounds = registry.getStructureBounds('TEST-S-A');
    expect(bounds).not.toBeNull();
    expect(bounds?.min.y).toBe(0);
    expect(bounds?.max.y).toBe(2);
  });
});
