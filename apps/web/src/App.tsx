import { useEffect, useRef } from 'react';
import { useCameraStore, useRegistryStore, useVisibilityStore } from '@anatomy/viewer';
import { registry } from './controller';
import { hideSelected, isolateSelected } from './controller';
import { useSelectionStore } from '@anatomy/viewer';
import { useAppStore } from './state/app';
import { useDataStore } from './state/data';
import { TopBar } from './components/TopBar';
import {
  DataErrorState,
  ErrorToasts,
  FixtureBanner,
  HelpOverlay,
  PerfOverlay,
  SelectionLiveRegion,
} from './components/Overlays';
import { ExplorePage } from './pages/ExplorePage';
import { LearnPage } from './pages/LearnPage';
import { QuizPage } from './pages/QuizPage';
import { SavedPage } from './pages/SavedPage';

function useStartup(): void {
  const load = useDataStore((s) => s.load);
  const status = useDataStore((s) => s.status);
  const index = useDataStore((s) => s.index);
  const bundles = useRegistryStore((s) => s.bundles);
  const requestReset = useCameraStore((s) => s.requestReset);
  const initialRequested = useRef(false);
  const cameraFitted = useRef(false);

  useEffect(() => {
    void load(registry);
  }, [load]);

  // Request initial bundles (marked in the master index) once data is ready.
  useEffect(() => {
    if (status !== 'ready' || !index || initialRequested.current) return;
    initialRequested.current = true;
    for (const bundle of index.bundles) {
      if (bundle.initial) void registry.requestBundle(bundle.bundle_id);
    }
  }, [status, index]);

  // First bundle becoming ready: frame the whole model once.
  useEffect(() => {
    if (cameraFitted.current) return;
    if (Object.values(bundles).some((b) => b.state === 'ready')) {
      cameraFitted.current = true;
      requestReset();
    }
  }, [bundles, requestReset]);
}

function useModeSync(): void {
  const syncModeFromHash = useAppStore((s) => s.syncModeFromHash);
  useEffect(() => {
    window.addEventListener('hashchange', syncModeFromHash);
    return () => window.removeEventListener('hashchange', syncModeFromHash);
  }, [syncModeFromHash]);
}

function useKeyboardShortcuts(): void {
  const setHelpOpen = useAppStore((s) => s.setHelpOpen);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const visibility = useVisibilityStore.getState();
      const selection = useSelectionStore.getState();
      const camera = useCameraStore.getState();
      if (event.key === '?') {
        event.preventDefault();
        setHelpOpen(!useAppStore.getState().helpOpen);
      } else if (event.key === 'Escape') {
        setHelpOpen(false);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) visibility.redo();
        else visibility.undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        visibility.redo();
      } else if (event.key.toLowerCase() === 'h') {
        hideSelected();
      } else if (event.key.toLowerCase() === 'i') {
        isolateSelected();
      } else if (event.key.toLowerCase() === 'r') {
        visibility.resetAll();
      } else if (event.key.toLowerCase() === 'f') {
        if (selection.selectedStructureId) camera.requestFocus(selection.selectedStructureId);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setHelpOpen]);
}

export function App() {
  const mode = useAppStore((s) => s.mode);
  const status = useDataStore((s) => s.status);
  useStartup();
  useModeSync();
  useKeyboardShortcuts();

  return (
    <div className="app">
      <TopBar />
      <FixtureBanner />
      {status === 'error' ? (
        <DataErrorState />
      ) : status !== 'ready' ? (
        <div className="app-loading" role="status">
          <p>Loading anatomy data…</p>
        </div>
      ) : (
        <>
          {mode === 'explore' ? <ExplorePage /> : null}
          {mode === 'learn' ? <LearnPage /> : null}
          {mode === 'quiz' ? <QuizPage /> : null}
          {mode === 'saved' ? <SavedPage /> : null}
        </>
      )}
      <ErrorToasts />
      <SelectionLiveRegion />
      <PerfOverlay />
      <HelpOverlay />
    </div>
  );
}
