import { beforeEach, describe, expect, it } from 'vitest';
import {
  AnatomySearch,
  buildAnatomyIndex,
  buildSearchDocs,
  makeBinding,
  makeManifest,
  makeStructure,
} from '@anatomy/core';
import { useSelectionStore } from '@anatomy/viewer';
import { resolveStructureMeta, selectStructure } from './controller';
import { useDataStore } from './state/data';
import { useStudyStore } from './state/study';

/**
 * Selection convergence: canvas, search and hierarchy all route through
 * selectStructure() and must land on identical logical state.
 */

function seedData() {
  const structures = [
    makeStructure({ structure_id: 'S-ROOT', canonical_name: 'Root', selectable: false }),
    makeStructure({
      structure_id: 'S-TRUNK',
      canonical_name: 'Trunk Column',
      parent_id: 'S-ROOT',
      synonyms: ['torso block'],
    }),
    makeStructure({
      structure_id: 'S-GHOST',
      canonical_name: 'Ghost Node',
      parent_id: 'S-ROOT',
    }),
  ];
  const manifests = [
    makeManifest({
      bundle_id: 'bundle-a',
      bindings: [
        makeBinding({
          geometry_id: 'G-TRUNK',
          structure_id: 'S-TRUNK',
          canonical_name: 'Trunk Column',
        }),
      ],
    }),
  ];
  const anatomy = buildAnatomyIndex({ structures, manifests });
  useDataStore.setState({
    status: 'ready',
    anatomy,
    search: new AnatomySearch(buildSearchDocs(anatomy)),
  });
}

beforeEach(() => {
  seedData();
  useSelectionStore.setState({
    selectedStructureId: null,
    selectedVia: null,
    hoveredStructureId: null,
  });
});

describe('selection convergence', () => {
  it('canvas, search and hierarchy selections produce the same logical state', () => {
    const captured: Array<{ id: string | null; hovered: string | null }> = [];

    for (const via of ['canvas', 'search', 'hierarchy'] as const) {
      useSelectionStore.setState({
        selectedStructureId: null,
        selectedVia: null,
        hoveredStructureId: null,
      });
      selectStructure('S-TRUNK', via);
      const state = useSelectionStore.getState();
      expect(state.selectedVia).toBe(via);
      captured.push({ id: state.selectedStructureId, hovered: state.hoveredStructureId });
    }

    expect(captured[0]).toEqual({ id: 'S-TRUNK', hovered: null });
    expect(captured[1]).toEqual(captured[0]);
    expect(captured[2]).toEqual(captured[0]);
  });

  it('ignores unknown structure ids instead of corrupting state', () => {
    selectStructure('S-DOES-NOT-EXIST', 'search');
    expect(useSelectionStore.getState().selectedStructureId).toBeNull();
  });

  it('selection is recorded in recents', () => {
    useStudyStore.getState().clearAll();
    selectStructure('S-TRUNK', 'search');
    expect(useStudyStore.getState().data.recents[0]?.structure_id).toBe('S-TRUNK');
  });

  it('search can select an ontology-only structure without geometry', () => {
    const search = useDataStore.getState().search;
    const results = search?.search('Ghost Node') ?? [];
    expect(results[0]?.structure_id).toBe('S-GHOST');
    expect(results[0]?.doc.has_geometry).toBe(false);
    selectStructure('S-GHOST', 'search');
    expect(useSelectionStore.getState().selectedStructureId).toBe('S-GHOST');
  });

  it('resolveStructureMeta exposes system and ancestor chain for visibility rules', () => {
    expect(resolveStructureMeta('S-TRUNK')).toEqual({
      system: 'test_system',
      ancestorIds: ['S-ROOT'],
    });
  });
});
