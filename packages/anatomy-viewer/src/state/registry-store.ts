import { create } from 'zustand';

export type BundleLoadState =
  | 'notRequested'
  | 'queued'
  | 'loadingManifest'
  | 'loadingGeometry'
  | 'ready'
  | 'error'
  | 'disposed';

export interface RegistryDiagnostic {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  bundle_id?: string;
  expected?: string;
  actual?: string;
}

export interface BundleSnapshot {
  bundleId: string;
  state: BundleLoadState;
  /** 0..1 geometry download progress where known. */
  progress: number;
  userMessage?: string;
  diagnostics: RegistryDiagnostic[];
  stats?: {
    meshCount: number;
    triangleCount: number;
    byteLength: number;
    excludedByLicense: number;
  };
}

interface RegistryStoreState {
  bundles: Record<string, BundleSnapshot>;
  upsert: (snapshot: BundleSnapshot) => void;
  reset: () => void;
}

export const useRegistryStore = create<RegistryStoreState>((set) => ({
  bundles: {},
  upsert: (snapshot) =>
    set((state) => ({ bundles: { ...state.bundles, [snapshot.bundleId]: snapshot } })),
  reset: () => set({ bundles: {} }),
}));

export function bundleState(
  bundles: Record<string, BundleSnapshot>,
  bundleId: string,
): BundleLoadState {
  return bundles[bundleId]?.state ?? 'notRequested';
}
