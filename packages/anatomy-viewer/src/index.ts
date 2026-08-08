export { AnatomyAssetRegistry, AssetLoadError } from './registry';
export type { AnatomyUserData, RegistryOptions } from './registry';
export { sceneCache, SceneCache } from './scene-cache';
export type { LoadedBundleScene } from './scene-cache';
export {
  applyEffectState,
  disposeEffects,
  registerMesh,
  setPickable,
  PRISTINE_EFFECT,
} from './materials';
export type { EffectState } from './materials';
export { installBvh, computeMeshBvh, disposeMeshBvh } from './bvh';
export { useSelectionStore } from './state/selection';
export type { SelectionSource, SelectionState } from './state/selection';
export { useVisibilityStore, isStructureVisible, EMPTY_VISIBILITY } from './state/visibility';
export type { VisibilitySnapshot, VisibilityState } from './state/visibility';
export { useRegistryStore, bundleState } from './state/registry-store';
export type { BundleLoadState, BundleSnapshot, RegistryDiagnostic } from './state/registry-store';
export { useCameraStore } from './state/camera';
export type { CameraRequest, CanonicalView } from './state/camera';
export { AnatomyCanvas, ViewerErrorBoundary } from './components/AnatomyCanvas';
export type { AnatomyCanvasProps, ViewerQuality } from './components/AnatomyCanvas';
export type { PickInfo } from './components/BundleGroups';
export type { StructureMeta, StructureMetaResolver } from './components/EffectsController';
export type { LabelEntry } from './components/StructureLabels';
export { perfStats, subscribePerf, getPerfVersion, publishPerf } from './perf';
export type { PerfStats } from './perf';
