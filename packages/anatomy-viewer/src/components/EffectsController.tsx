import { useEffect, useSyncExternalStore } from 'react';
import { useThree } from '@react-three/fiber';
import { applyEffectState, type EffectState } from '../materials';
import { sceneCache } from '../scene-cache';
import { useSelectionStore } from '../state/selection';
import { isStructureVisible, useVisibilityStore } from '../state/visibility';
import { publishPerf } from '../perf';

export interface StructureMeta {
  system: string;
  ancestorIds: string[];
}

export type StructureMetaResolver = (structureId: string) => StructureMeta | null;

interface EffectsControllerProps {
  resolveStructure: StructureMetaResolver;
  /** Extra highlighted structures (e.g. quiz "show correct answer"). */
  extraHighlightStructureIds?: string[];
}

/**
 * Projects logical state (selection, hover, visibility, fade, x-ray) onto the
 * loaded meshes. Runs as an effect — never inside the render loop — and asks
 * for a single new frame afterwards.
 */
export function EffectsController({
  resolveStructure,
  extraHighlightStructureIds,
}: EffectsControllerProps): null {
  const invalidate = useThree((state) => state.invalidate);
  const selectedStructureId = useSelectionStore((s) => s.selectedStructureId);
  const hoveredStructureId = useSelectionStore((s) => s.hoveredStructureId);
  const visibility = useVisibilityStore();
  const cacheVersion = useSyncExternalStore(
    (cb) => sceneCache.subscribe(cb),
    () => sceneCache.getVersion(),
  );

  useEffect(() => {
    const started = performance.now();
    const extra = extraHighlightStructureIds ?? [];
    for (const { mesh, binding } of sceneCache.allMeshes()) {
      const meta = resolveStructure(binding.structure_id) ?? {
        system: binding.system,
        ancestorIds: [],
      };
      const visible = isStructureVisible(
        visibility,
        binding.structure_id,
        meta.system,
        meta.ancestorIds,
      );
      const highlighted =
        binding.structure_id === selectedStructureId || extra.includes(binding.structure_id);
      const inFocusSet =
        highlighted ||
        (visibility.isolatedStructureIds !== null &&
          (visibility.isolatedStructureIds.includes(binding.structure_id) ||
            meta.ancestorIds.some((a) => visibility.isolatedStructureIds?.includes(a))));
      const state: EffectState = {
        hidden: !visible,
        highlighted,
        hovered: binding.structure_id === hoveredStructureId && !highlighted,
        fade: visibility.fadeOthers && !inFocusSet ? visibility.fadeOpacity : null,
        xray: visibility.xray && !highlighted,
      };
      applyEffectState(mesh, state);
    }
    publishPerf({
      lastEffectApplyMs: Math.round((performance.now() - started) * 100) / 100,
      loadedBundles: sceneCache.all().length,
    });
    invalidate();
  }, [
    resolveStructure,
    extraHighlightStructureIds,
    selectedStructureId,
    hoveredStructureId,
    visibility,
    cacheVersion,
    invalidate,
  ]);

  return null;
}
