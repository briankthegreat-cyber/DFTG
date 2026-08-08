import { create } from 'zustand';

export type CanonicalView = 'anterior' | 'posterior' | 'left' | 'right' | 'superior' | 'inferior';

export interface CameraRequest {
  token: number;
  kind: 'focus-structure' | 'view' | 'fit-visible' | 'reset';
  structureId?: string;
  view?: CanonicalView;
}

interface CameraState {
  request: CameraRequest | null;
  requestFocus: (structureId: string) => void;
  requestView: (view: CanonicalView) => void;
  requestFitVisible: () => void;
  requestReset: () => void;
  /** CameraRig acknowledges a request once consumed or cancelled. */
  consume: (token: number) => void;
}

let tokenCounter = 0;

export const useCameraStore = create<CameraState>((set, get) => ({
  request: null,
  requestFocus: (structureId) =>
    set({ request: { token: ++tokenCounter, kind: 'focus-structure', structureId } }),
  requestView: (view) => set({ request: { token: ++tokenCounter, kind: 'view', view } }),
  requestFitVisible: () => set({ request: { token: ++tokenCounter, kind: 'fit-visible' } }),
  requestReset: () => set({ request: { token: ++tokenCounter, kind: 'reset' } }),
  consume: (token) => {
    if (get().request?.token === token) set({ request: null });
  },
}));
