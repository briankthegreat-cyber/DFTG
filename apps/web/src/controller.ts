import { getAncestors, getDescendants, type OntologyStructure } from '@anatomy/core';
import {
  AnatomyAssetRegistry,
  useCameraStore,
  useRegistryStore,
  useSelectionStore,
  useVisibilityStore,
  type SelectionSource,
  type StructureMeta,
} from '@anatomy/viewer';
import { ASSET_BASE_URL, RELEASE_POLICY, VERIFY_HASHES } from './config';
import { useDataStore } from './state/data';
import { useStudyStore } from './state/study';

/**
 * App controller: the single write-path for cross-store actions so canvas,
 * search, hierarchy, labels and quiz all converge on identical state.
 */

export const registry = new AnatomyAssetRegistry({
  baseUrl: ASSET_BASE_URL,
  policy: RELEASE_POLICY,
  verifyHashes: VERIFY_HASHES,
  onSnapshot: (snapshot) => useRegistryStore.getState().upsert(snapshot),
});

export function structureById(structureId: string): OntologyStructure | undefined {
  return useDataStore.getState().anatomy?.structuresById.get(structureId);
}

export function labelFor(structureId: string): string {
  const structure = structureById(structureId);
  return structure?.display_name ?? structure?.canonical_name ?? structureId;
}

export function resolveStructureMeta(structureId: string): StructureMeta | null {
  const anatomy = useDataStore.getState().anatomy;
  if (!anatomy) return null;
  const structure = anatomy.structuresById.get(structureId);
  if (!structure) return null;
  return { system: structure.system, ancestorIds: getAncestors(anatomy, structureId) };
}

export async function ensureGeometryForStructure(structureId: string): Promise<void> {
  const anatomy = useDataStore.getState().anatomy;
  const bundleIds = anatomy?.bundleIdsByStructureId.get(structureId) ?? [];
  await Promise.all(bundleIds.map((bundleId) => registry.requestBundle(bundleId)));
}

export interface SelectOptions {
  /** Fly the camera to the structure (search/hierarchy/lesson flows). */
  focus?: boolean;
}

/** One selection path for every input source — state always converges. */
export function selectStructure(
  structureId: string,
  via: SelectionSource,
  options: SelectOptions = {},
): void {
  const anatomy = useDataStore.getState().anatomy;
  if (!anatomy?.structuresById.has(structureId)) return;
  useSelectionStore.getState().select(structureId, via);
  useStudyStore.getState().pushRecent(structureId);
  void ensureGeometryForStructure(structureId).then(() => {
    if (options.focus) useCameraStore.getState().requestFocus(structureId);
  });
}

export function selectedWithDescendants(): string[] {
  const selected = useSelectionStore.getState().selectedStructureId;
  const anatomy = useDataStore.getState().anatomy;
  if (!selected || !anatomy) return [];
  return [selected, ...getDescendants(anatomy, selected)];
}

export function hideSelected(): void {
  const selected = useSelectionStore.getState().selectedStructureId;
  if (selected) useVisibilityStore.getState().hideStructures([selected]);
}

export function isolateSelected(): void {
  const selected = useSelectionStore.getState().selectedStructureId;
  if (selected) useVisibilityStore.getState().isolate([selected]);
}

/**
 * Layer peel: hide the currently exposed selected structure (recorded in undo
 * history) and keep the logical selection so the panel stays honest about it.
 */
export function peelSelected(): void {
  hideSelected();
}

export function revealParent(): void {
  const selected = useSelectionStore.getState().selectedStructureId;
  const anatomy = useDataStore.getState().anatomy;
  if (!selected || !anatomy) return;
  const parent = anatomy.structuresById.get(selected)?.parent_id;
  if (parent) {
    const visibility = useVisibilityStore.getState();
    visibility.showStructures([parent, selected]);
  }
}

export function revealChildren(): void {
  const selected = useSelectionStore.getState().selectedStructureId;
  const anatomy = useDataStore.getState().anatomy;
  if (!selected || !anatomy) return;
  const children = anatomy.childrenByParentId.get(selected) ?? [];
  useVisibilityStore.getState().showStructures([selected, ...children]);
}

export function revealSystemOfSelected(): void {
  const selected = useSelectionStore.getState().selectedStructureId;
  const structure = selected ? structureById(selected) : undefined;
  if (structure) useVisibilityStore.getState().setSystemHidden(structure.system, false);
}

/** Structures whose geometry sits in a currently-ready bundle (quiz availability). */
export function availableStructureIds(): Set<string> {
  const anatomy = useDataStore.getState().anatomy;
  const bundles = useRegistryStore.getState().bundles;
  const available = new Set<string>();
  if (!anatomy) return available;
  for (const [structureId, bundleIds] of anatomy.bundleIdsByStructureId) {
    if (bundleIds.some((id) => bundles[id]?.state === 'ready')) available.add(structureId);
  }
  return available;
}

export function labelAnchorFor(structureId: string): [number, number, number] | null {
  const bounds = registry.getStructureBounds(structureId);
  if (!bounds) return null;
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  const centerZ = (bounds.min.z + bounds.max.z) / 2;
  return [centerX, bounds.max.y + 0.04, centerZ];
}
