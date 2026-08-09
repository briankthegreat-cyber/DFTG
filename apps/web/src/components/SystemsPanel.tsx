import { Badge, Button, Panel, ProgressBar, Toggle } from '@anatomy/ui';
import { useRegistryStore, useVisibilityStore, type BundleLoadState } from '@anatomy/viewer';
import { registry } from '../controller';
import { useDataStore } from '../state/data';

const STATE_TONE: Record<BundleLoadState, 'neutral' | 'info' | 'success' | 'danger'> = {
  notRequested: 'neutral',
  queued: 'info',
  loadingManifest: 'info',
  loadingGeometry: 'info',
  ready: 'success',
  error: 'danger',
  disposed: 'neutral',
};

const STATE_LABEL: Record<BundleLoadState, string> = {
  notRequested: 'not loaded',
  queued: 'queued',
  loadingManifest: 'manifest…',
  loadingGeometry: 'loading…',
  ready: 'ready',
  error: 'failed',
  disposed: 'unloaded',
};

/** Body systems with visibility toggles and per-bundle progressive loading. */
export function SystemsPanel() {
  const anatomy = useDataStore((s) => s.anatomy);
  const bundles = useRegistryStore((s) => s.bundles);
  const hiddenSystems = useVisibilityStore((s) => s.hiddenSystems);
  const toggleSystem = useVisibilityStore((s) => s.toggleSystem);

  if (!anatomy) return null;

  return (
    <Panel title="Systems" aria-label="Body systems">
      <ul className="systems">
        {anatomy.systems.map((system) => (
          <li key={system.system} className="systems__row">
            <Toggle
              checked={!hiddenSystems.includes(system.system)}
              onChange={() => toggleSystem(system.system)}
              label={`${system.display_name} (${system.structure_count})`}
            />
            <div className="systems__bundles">
              {system.bundle_ids.map((bundleId) => {
                const snapshot = bundles[bundleId];
                const state: BundleLoadState = snapshot?.state ?? 'notRequested';
                const loading =
                  state === 'queued' || state === 'loadingManifest' || state === 'loadingGeometry';
                return (
                  <div
                    key={bundleId}
                    className="systems__bundle"
                    data-testid={`bundle-row-${bundleId}`}
                  >
                    <span className="systems__bundle-name">{bundleId}</span>
                    <Badge tone={STATE_TONE[state]} title={snapshot?.userMessage}>
                      <span data-testid={`bundle-state-${bundleId}`}>{STATE_LABEL[state]}</span>
                    </Badge>
                    {loading ? (
                      <ProgressBar value={snapshot?.progress ?? 0} label={`${bundleId} progress`} />
                    ) : null}
                    {state === 'notRequested' || state === 'disposed' || state === 'error' ? (
                      <Button
                        size="sm"
                        onClick={() => void registry.requestBundle(bundleId)}
                        data-testid={`bundle-load-${bundleId}`}
                      >
                        {state === 'error' ? 'Retry' : 'Load'}
                      </Button>
                    ) : null}
                    {state === 'ready' ? (
                      <Button size="sm" onClick={() => registry.unloadBundle(bundleId)}>
                        Unload
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
