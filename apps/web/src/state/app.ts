import { create } from 'zustand';
import type { ViewerQuality } from '@anatomy/viewer';

export type AppMode = 'explore' | 'learn' | 'quiz' | 'saved';

const MODES: AppMode[] = ['explore', 'learn', 'quiz', 'saved'];

export function modeFromHash(hash: string): AppMode {
  const candidate = hash.replace(/^#\/?/, '').split('/')[0];
  return (MODES as string[]).includes(candidate ?? '') ? (candidate as AppMode) : 'explore';
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function hasFinePointer(): boolean {
  return typeof window !== 'undefined' ? window.matchMedia('(pointer: fine)').matches : true;
}

interface AppState {
  mode: AppMode;
  quality: ViewerQuality;
  highContrast: boolean;
  reducedMotion: boolean;
  hoverEnabled: boolean;
  helpOpen: boolean;
  diagnosticsOpen: boolean;
  perfOpen: boolean;
  contextLost: boolean;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  setMode: (mode: AppMode) => void;
  syncModeFromHash: () => void;
  setQuality: (quality: ViewerQuality) => void;
  setHighContrast: (on: boolean) => void;
  setReducedMotion: (on: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  setDiagnosticsOpen: (open: boolean) => void;
  setPerfOpen: (open: boolean) => void;
  setContextLost: (lost: boolean) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: typeof window !== 'undefined' ? modeFromHash(window.location.hash) : 'explore',
  quality: 'medium',
  highContrast: false,
  reducedMotion: prefersReducedMotion(),
  hoverEnabled: hasFinePointer(),
  helpOpen: false,
  diagnosticsOpen: false,
  perfOpen: false,
  contextLost: false,
  leftPanelOpen: true,
  rightPanelOpen: true,
  setMode: (mode) => {
    if (typeof window !== 'undefined' && modeFromHash(window.location.hash) !== mode) {
      window.location.hash = `#/${mode}`;
    }
    set({ mode });
  },
  syncModeFromHash: () => {
    if (typeof window !== 'undefined') set({ mode: modeFromHash(window.location.hash) });
  },
  setQuality: (quality) => set({ quality }),
  setHighContrast: (highContrast) => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    set({ highContrast });
  },
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setDiagnosticsOpen: (diagnosticsOpen) => set({ diagnosticsOpen }),
  setPerfOpen: (perfOpen) => set({ perfOpen }),
  setContextLost: (contextLost) => set({ contextLost }),
  setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen }),
  setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
}));

interface UiState {
  labeledStructureIds: string[];
  toggleLabel: (structureId: string) => void;
  clearLabels: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  labeledStructureIds: [],
  toggleLabel: (structureId) =>
    set((state) => ({
      labeledStructureIds: state.labeledStructureIds.includes(structureId)
        ? state.labeledStructureIds.filter((id) => id !== structureId)
        : [...state.labeledStructureIds, structureId],
    })),
  clearLabels: () => set({ labeledStructureIds: [] }),
}));
