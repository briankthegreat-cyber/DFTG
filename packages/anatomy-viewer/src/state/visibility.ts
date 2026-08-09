import { create } from 'zustand';

/**
 * Visibility is explicit, undoable state — never irreversible scene mutation.
 * Hiding, isolating, fading, x-ray and layer-peel all reduce to this snapshot,
 * which the EffectsController projects onto loaded meshes.
 */
export interface VisibilitySnapshot {
  /** Systems currently toggled off. */
  hiddenSystems: string[];
  /** Per-structure hide overrides (apply to the structure and its descendants). */
  hiddenStructures: string[];
  /** When non-null, only these structures (and descendants) are visible. */
  isolatedStructureIds: string[] | null;
  /** Fade all structures except selection/isolation to this opacity. */
  fadeOthers: boolean;
  fadeOpacity: number;
  /** Transparent-context mode; reversible material handling only. */
  xray: boolean;
}

export const EMPTY_VISIBILITY: VisibilitySnapshot = {
  hiddenSystems: [],
  hiddenStructures: [],
  isolatedStructureIds: null,
  fadeOthers: false,
  fadeOpacity: 0.18,
  xray: false,
};

const HISTORY_LIMIT = 100;

export interface VisibilityState extends VisibilitySnapshot {
  past: VisibilitySnapshot[];
  future: VisibilitySnapshot[];
  toggleSystem: (system: string) => void;
  setSystemHidden: (system: string, hidden: boolean) => void;
  hideStructures: (structureIds: string[]) => void;
  showStructures: (structureIds: string[]) => void;
  isolate: (structureIds: string[]) => void;
  clearIsolation: () => void;
  setFade: (enabled: boolean, opacity?: number) => void;
  /** Transient slider preview — no history entry (see commitSnapshot). */
  previewFade: (opacity: number) => void;
  /**
   * Push a caller-captured pre-gesture snapshot as ONE history entry, so a
   * continuous slider drag costs one undo step instead of one per tick.
   */
  commitSnapshot: (before: VisibilitySnapshot) => void;
  setXray: (on: boolean) => void;
  undo: () => void;
  redo: () => void;
  resetAll: () => void;
}

export function snapshotVisibility(state: VisibilitySnapshot): VisibilitySnapshot {
  return snapshotOf(state);
}

function snapshotOf(state: VisibilitySnapshot): VisibilitySnapshot {
  return {
    hiddenSystems: [...state.hiddenSystems],
    hiddenStructures: [...state.hiddenStructures],
    isolatedStructureIds: state.isolatedStructureIds ? [...state.isolatedStructureIds] : null,
    fadeOthers: state.fadeOthers,
    fadeOpacity: state.fadeOpacity,
    xray: state.xray,
  };
}

export const useVisibilityStore = create<VisibilityState>((set, get) => {
  const commit = (next: Partial<VisibilitySnapshot>) => {
    const current = get();
    set({
      ...next,
      past: [...current.past.slice(-HISTORY_LIMIT), snapshotOf(current)],
      future: [],
    });
  };

  return {
    ...EMPTY_VISIBILITY,
    past: [],
    future: [],

    toggleSystem: (system) => {
      const { hiddenSystems } = get();
      commit({
        hiddenSystems: hiddenSystems.includes(system)
          ? hiddenSystems.filter((s) => s !== system)
          : [...hiddenSystems, system],
      });
    },

    setSystemHidden: (system, hidden) => {
      const { hiddenSystems } = get();
      const has = hiddenSystems.includes(system);
      if (hidden === has) return;
      commit({
        hiddenSystems: hidden
          ? [...hiddenSystems, system]
          : hiddenSystems.filter((s) => s !== system),
      });
    },

    hideStructures: (structureIds) => {
      const { hiddenStructures } = get();
      const merged = [...hiddenStructures];
      for (const id of structureIds) if (!merged.includes(id)) merged.push(id);
      commit({ hiddenStructures: merged });
    },

    showStructures: (structureIds) => {
      const { hiddenStructures } = get();
      commit({ hiddenStructures: hiddenStructures.filter((id) => !structureIds.includes(id)) });
    },

    isolate: (structureIds) => commit({ isolatedStructureIds: [...structureIds] }),
    clearIsolation: () => commit({ isolatedStructureIds: null }),

    setFade: (enabled, opacity) => {
      const next: Partial<VisibilitySnapshot> = { fadeOthers: enabled };
      if (opacity !== undefined) next.fadeOpacity = opacity;
      commit(next);
    },

    previewFade: (opacity) => set({ fadeOthers: true, fadeOpacity: opacity }),

    commitSnapshot: (before) => {
      const current = get();
      set({
        past: [...current.past.slice(-HISTORY_LIMIT), snapshotOf(before)],
        future: [],
      });
    },

    setXray: (on) => commit({ xray: on }),

    undo: () => {
      const { past, future } = get();
      const previous = past[past.length - 1];
      if (!previous) return;
      set({
        ...previous,
        past: past.slice(0, -1),
        future: [snapshotOf(get()), ...future].slice(0, HISTORY_LIMIT),
      });
    },

    redo: () => {
      const { past, future } = get();
      const next = future[0];
      if (!next) return;
      set({
        ...next,
        past: [...past, snapshotOf(get())].slice(-HISTORY_LIMIT),
        future: future.slice(1),
      });
    },

    resetAll: () => commit(snapshotOf(EMPTY_VISIBILITY)),
  };
});

/**
 * Effective visibility for one structure given its system and ancestor chain.
 * Pure so the hierarchy tree, canvas effects, and tests share one truth.
 */
export function isStructureVisible(
  snap: VisibilitySnapshot,
  structureId: string,
  system: string,
  ancestorIds: readonly string[],
): boolean {
  if (snap.isolatedStructureIds !== null) {
    const inIsolation =
      snap.isolatedStructureIds.includes(structureId) ||
      ancestorIds.some((a) => snap.isolatedStructureIds?.includes(a));
    if (!inIsolation) return false;
  }
  if (snap.hiddenStructures.includes(structureId)) return false;
  if (ancestorIds.some((a) => snap.hiddenStructures.includes(a))) return false;
  if (snap.hiddenSystems.includes(system)) return false;
  return true;
}
