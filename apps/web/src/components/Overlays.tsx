import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button, InlineNotice, ProgressBar } from '@anatomy/ui';
import {
  getPerfVersion,
  perfStats,
  subscribePerf,
  useRegistryStore,
  useSelectionStore,
} from '@anatomy/viewer';
import { registry, structureById } from '../controller';
import { useAppStore } from '../state/app';
import { useDataStore } from '../state/data';

/** Banner shown whenever the loaded dataset is the synthetic development fixture. */
export function FixtureBanner() {
  const index = useDataStore((s) => s.index);
  if (index?.release_stage !== 'development_fixture') return null;
  return (
    <div className="fixture-banner" data-testid="banner-fixture" role="note">
      Development fixture data — synthetic geometry and placeholder content for engineering use. Not
      medical content.
    </div>
  );
}

/** Per-bundle load progress, bottom-left, non-blocking. */
export function LoadProgress() {
  const bundles = useRegistryStore((s) => s.bundles);
  const active = Object.values(bundles).filter(
    (b) => b.state === 'queued' || b.state === 'loadingManifest' || b.state === 'loadingGeometry',
  );
  if (active.length === 0) return null;
  return (
    <div className="load-progress" aria-live="polite">
      {active.map((bundle) => (
        <div key={bundle.bundleId} className="load-progress__row">
          <span>{bundle.bundleId}</span>
          <ProgressBar value={bundle.progress} label={`Loading ${bundle.bundleId}`} />
        </div>
      ))}
    </div>
  );
}

/** Non-blocking error toasts for failed bundles, with retry. */
export function ErrorToasts() {
  const bundles = useRegistryStore((s) => s.bundles);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const failed = Object.values(bundles).filter(
    (b) => b.state === 'error' && !dismissed.includes(b.bundleId),
  );
  if (failed.length === 0) return null;
  return (
    <div className="error-toasts">
      {failed.map((bundle) => (
        <InlineNotice key={bundle.bundleId} tone="danger">
          <strong>{bundle.bundleId}:</strong>{' '}
          {bundle.userMessage ?? 'This system could not be loaded.'}
          <span className="error-toasts__actions">
            <Button size="sm" onClick={() => void registry.requestBundle(bundle.bundleId)}>
              Retry
            </Button>
            <Button
              size="sm"
              onClick={() => setDismissed((d) => [...d, bundle.bundleId])}
              aria-label={`Dismiss error for ${bundle.bundleId}`}
            >
              Dismiss
            </Button>
          </span>
        </InlineNotice>
      ))}
    </div>
  );
}

/** Screen-reader announcement of the current selection. */
export function SelectionLiveRegion() {
  const selectedStructureId = useSelectionStore((s) => s.selectedStructureId);
  const structure = selectedStructureId ? structureById(selectedStructureId) : undefined;
  return (
    <div className="sr-only" aria-live="polite" role="status">
      {structure
        ? `Selected ${structure.display_name ?? structure.canonical_name}, system ${structure.system}, laterality ${structure.laterality}.`
        : ''}
    </div>
  );
}

/** Development performance overlay (FPS, draw calls, memory, pick latency). */
export function PerfOverlay() {
  const perfOpen = useAppStore((s) => s.perfOpen);
  useSyncExternalStore(subscribePerf, getPerfVersion);
  if (!perfOpen) return null;
  return (
    <div className="perf-overlay" aria-label="Performance statistics">
      <div>fps {perfStats.fps}</div>
      <div>draw calls {perfStats.drawCalls}</div>
      <div>triangles {perfStats.triangles}</div>
      <div>geometries {perfStats.geometries}</div>
      <div>bundles {perfStats.loadedBundles}</div>
      <div>effects {perfStats.lastEffectApplyMs} ms</div>
      <div>pick {perfStats.lastPickMs} ms</div>
    </div>
  );
}

const HELP_SECTIONS: { title: string; rows: [string, string][] }[] = [
  {
    title: 'Mouse / touch',
    rows: [
      ['Drag', 'Orbit around the model'],
      ['Right-drag / two-finger drag', 'Pan'],
      ['Wheel / pinch', 'Zoom'],
      ['Click / tap a structure', 'Select it'],
      ['Click empty space', 'Clear selection'],
    ],
  },
  {
    title: 'Keyboard',
    rows: [
      ['/', 'Focus search'],
      ['F', 'Focus camera on selection'],
      ['H', 'Hide selection'],
      ['I', 'Isolate selection'],
      ['R', 'Reset visibility'],
      ['Ctrl+Z / Ctrl+Y', 'Undo / redo visibility'],
      ['?', 'Toggle this help'],
      ['Esc', 'Close dialogs'],
    ],
  },
];

export function HelpOverlay() {
  const helpOpen = useAppStore((s) => s.helpOpen);
  const setHelpOpen = useAppStore((s) => s.setHelpOpen);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Modal focus contract: move focus in on open, trap Tab inside, restore the
  // opener's focus on close.
  useEffect(() => {
    if (!helpOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    modalRef.current?.focus();
    return () => previous?.focus();
  }, [helpOpen]);

  if (!helpOpen) return null;

  const trapFocus = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setHelpOpen(false);
      return;
    }
    if (event.key !== 'Tab' || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setHelpOpen(false)}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Controls help"
        ref={modalRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={trapFocus}
      >
        <h2>Controls</h2>
        {HELP_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3>{section.title}</h3>
            <dl className="help-list">
              {section.rows.map(([key, description]) => (
                <div key={key} className="help-list__row">
                  <dt>
                    <kbd>{key}</kbd>
                  </dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        <Button variant="primary" onClick={() => setHelpOpen(false)}>
          Close
        </Button>
      </div>
    </div>
  );
}

/** Full-screen data failure state with retry. */
export function DataErrorState() {
  const status = useDataStore((s) => s.status);
  const errorMessage = useDataStore((s) => s.errorMessage);
  const load = useDataStore((s) => s.load);
  if (status !== 'error') return null;
  return (
    <div className="data-error" role="alert">
      <h2>The anatomy data could not be loaded</h2>
      <p>{errorMessage}</p>
      <p>
        Check that the asset server at the configured base URL is reachable, then try again. No
        cached or partial anatomy is shown to avoid presenting incomplete data as complete.
      </p>
      <Button variant="primary" onClick={() => void load(registry)}>
        Retry
      </Button>
    </div>
  );
}
