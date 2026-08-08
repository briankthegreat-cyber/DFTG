import { describe, expect, it } from 'vitest';
import { buildAnatomyIndex, getAncestors, getDescendants } from './ontology';
import { makeBinding, makeManifest, makeStructure } from './testing';

function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected value to be defined');
  return value;
}

describe('buildAnatomyIndex', () => {
  it('derives children and roots from parent_id', () => {
    const index = buildAnatomyIndex({
      structures: [
        makeStructure({ structure_id: 'TEST-S-A', parent_id: null }),
        makeStructure({ structure_id: 'TEST-S-B', parent_id: 'TEST-S-A' }),
        makeStructure({ structure_id: 'TEST-S-C', parent_id: 'TEST-S-B' }),
      ],
      manifests: [],
    });
    expect(index.rootStructureIds).toEqual(['TEST-S-A']);
    expect(index.childrenByParentId.get('TEST-S-A')).toEqual(['TEST-S-B']);
    expect(index.childrenByParentId.get('TEST-S-B')).toEqual(['TEST-S-C']);
    expect(index.issues).toEqual([]);
  });

  it('reports duplicate structure_id as an error and keeps the first entry', () => {
    const index = buildAnatomyIndex({
      structures: [
        makeStructure({ structure_id: 'TEST-S-DUP', canonical_name: 'First Definition' }),
        makeStructure({ structure_id: 'TEST-S-DUP', canonical_name: 'Second Definition' }),
      ],
      manifests: [],
    });
    const issue = must(index.issues.find((i) => i.code === 'duplicate_structure_id'));
    expect(issue.severity).toBe('error');
    expect(issue.ref).toBe('TEST-S-DUP');
    expect(must(index.structuresById.get('TEST-S-DUP')).canonical_name).toBe('First Definition');
  });

  it('treats a structure with a missing parent as a root and warns', () => {
    const index = buildAnatomyIndex({
      structures: [makeStructure({ structure_id: 'TEST-S-ORPHAN', parent_id: 'TEST-S-MISSING' })],
      manifests: [],
    });
    const issue = must(index.issues.find((i) => i.code === 'orphan_parent'));
    expect(issue.severity).toBe('warning');
    expect(index.rootStructureIds).toContain('TEST-S-ORPHAN');
    expect(index.childrenByParentId.get('TEST-S-MISSING')).toBeUndefined();
  });

  it('breaks a parent cycle with an error and keeps every structure reachable from roots', () => {
    const index = buildAnatomyIndex({
      structures: [
        makeStructure({ structure_id: 'TEST-S-CYCLE-A', parent_id: 'TEST-S-CYCLE-B' }),
        makeStructure({ structure_id: 'TEST-S-CYCLE-B', parent_id: 'TEST-S-CYCLE-A' }),
      ],
      manifests: [],
    });
    const issue = must(index.issues.find((i) => i.code === 'hierarchy_cycle'));
    expect(issue.severity).toBe('error');

    const reachable = new Set<string>();
    for (const root of index.rootStructureIds) {
      reachable.add(root);
      for (const id of getDescendants(index, root)) reachable.add(id);
    }
    expect(reachable.has('TEST-S-CYCLE-A')).toBe(true);
    expect(reachable.has('TEST-S-CYCLE-B')).toBe(true);
  });

  it('synthesizes a structure for a binding that references an unknown structure', () => {
    const index = buildAnatomyIndex({
      structures: [],
      manifests: [
        makeManifest({
          bindings: [
            makeBinding({
              geometry_id: 'TEST-G-GHOST',
              structure_id: 'TEST-S-GHOST',
              canonical_name: 'Ghost Structure',
            }),
          ],
        }),
      ],
    });
    const issue = must(index.issues.find((i) => i.code === 'binding_without_structure'));
    expect(issue.severity).toBe('warning');
    const synthesized = must(index.structuresById.get('TEST-S-GHOST'));
    expect(synthesized.canonical_name).toBe('Ghost Structure');
    expect(synthesized.source['synthesized_from_binding']).toBe(true);
    expect(synthesized.development_fixture).toBe(true);
  });

  it('reports duplicate geometry_id across manifests as an error and keeps the first binding', () => {
    const index = buildAnatomyIndex({
      structures: [
        makeStructure({ structure_id: 'TEST-S-A' }),
        makeStructure({ structure_id: 'TEST-S-B' }),
      ],
      manifests: [
        makeManifest({
          bundle_id: 'bundle-one',
          bindings: [makeBinding({ geometry_id: 'TEST-G-DUP', structure_id: 'TEST-S-A' })],
        }),
        makeManifest({
          bundle_id: 'bundle-two',
          bindings: [makeBinding({ geometry_id: 'TEST-G-DUP', structure_id: 'TEST-S-B' })],
        }),
      ],
    });
    const issue = must(index.issues.find((i) => i.code === 'duplicate_geometry_id'));
    expect(issue.severity).toBe('error');
    expect(must(index.bindingsByGeometryId.get('TEST-G-DUP')).structure_id).toBe('TEST-S-A');
    expect(index.bindingsByStructureId.get('TEST-S-B')).toBeUndefined();
  });
});

describe('getAncestors / getDescendants', () => {
  const treeIndex = buildAnatomyIndex({
    structures: [
      makeStructure({ structure_id: 'TEST-S-ROOT', parent_id: null }),
      makeStructure({ structure_id: 'TEST-S-MID', parent_id: 'TEST-S-ROOT' }),
      makeStructure({ structure_id: 'TEST-S-MID-2', parent_id: 'TEST-S-ROOT' }),
      makeStructure({ structure_id: 'TEST-S-LEAF', parent_id: 'TEST-S-MID' }),
    ],
    manifests: [],
  });

  it('returns ancestors nearest-first on a 3-level tree', () => {
    expect(getAncestors(treeIndex, 'TEST-S-LEAF')).toEqual(['TEST-S-MID', 'TEST-S-ROOT']);
    expect(getAncestors(treeIndex, 'TEST-S-ROOT')).toEqual([]);
  });

  it('returns all descendants excluding the structure itself', () => {
    expect([...getDescendants(treeIndex, 'TEST-S-ROOT')].sort()).toEqual([
      'TEST-S-LEAF',
      'TEST-S-MID',
      'TEST-S-MID-2',
    ]);
    expect(getDescendants(treeIndex, 'TEST-S-MID')).toEqual(['TEST-S-LEAF']);
    expect(getDescendants(treeIndex, 'TEST-S-LEAF')).toEqual([]);
  });

  it('terminates without duplicates when the raw hierarchy contains a cycle', () => {
    const cyclic = buildAnatomyIndex({
      structures: [
        makeStructure({ structure_id: 'TEST-S-CYCLE-A', parent_id: 'TEST-S-CYCLE-B' }),
        makeStructure({ structure_id: 'TEST-S-CYCLE-B', parent_id: 'TEST-S-CYCLE-A' }),
      ],
      manifests: [],
    });
    const ancestorsA = getAncestors(cyclic, 'TEST-S-CYCLE-A');
    const ancestorsB = getAncestors(cyclic, 'TEST-S-CYCLE-B');
    expect(ancestorsA).toEqual(['TEST-S-CYCLE-B']);
    expect(ancestorsB).toEqual(['TEST-S-CYCLE-A']);
    for (const root of cyclic.rootStructureIds) {
      const descendants = getDescendants(cyclic, root);
      expect(new Set(descendants).size).toBe(descendants.length);
    }
  });
});
