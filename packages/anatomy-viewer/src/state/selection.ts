import { create } from 'zustand';

export type SelectionSource = 'canvas' | 'search' | 'hierarchy' | 'quiz' | 'label' | 'relationship';

/**
 * Selection is logical state keyed by structure_id. It stays valid even when
 * the geometry that produced it unloads — the UI then reports "geometry not
 * loaded" instead of dropping the selection.
 */
export interface SelectionState {
  selectedStructureId: string | null;
  selectedVia: SelectionSource | null;
  hoveredStructureId: string | null;
  select: (structureId: string, via: SelectionSource) => void;
  clear: () => void;
  setHovered: (structureId: string | null) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedStructureId: null,
  selectedVia: null,
  hoveredStructureId: null,
  select: (structureId, via) => set({ selectedStructureId: structureId, selectedVia: via }),
  clear: () => set({ selectedStructureId: null, selectedVia: null }),
  setHovered: (structureId) => set({ hoveredStructureId: structureId }),
}));
