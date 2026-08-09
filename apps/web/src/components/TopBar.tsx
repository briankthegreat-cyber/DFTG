import { useEffect, useRef, useState } from 'react';
import { Badge, Button } from '@anatomy/ui';
import { useRegistryStore, type ViewerQuality } from '@anatomy/viewer';
import { RELEASE_POLICY } from '../config';
import { useAppStore, type AppMode } from '../state/app';
import { useDataStore } from '../state/data';
import { SearchBox } from './SearchBox';

const MODES: { mode: AppMode; label: string }[] = [
  { mode: 'explore', label: 'Explore' },
  { mode: 'learn', label: 'Learn' },
  { mode: 'quiz', label: 'Quiz' },
  { mode: 'saved', label: 'Saved' },
];

function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const app = useAppStore();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="settings-menu" ref={containerRef}>
      <Button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title="Viewer and accessibility settings"
      >
        Settings
      </Button>
      {open ? (
        <div className="settings-menu__popup" role="menu" aria-label="Settings">
          <label className="settings-menu__row">
            Render quality
            <select
              value={app.quality}
              onChange={(event) => app.setQuality(event.target.value as ViewerQuality)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="settings-menu__row">
            <input
              type="checkbox"
              checked={app.highContrast}
              onChange={(event) => app.setHighContrast(event.target.checked)}
            />
            High-contrast UI
          </label>
          <label className="settings-menu__row">
            <input
              type="checkbox"
              checked={app.reducedMotion}
              onChange={(event) => app.setReducedMotion(event.target.checked)}
            />
            Reduce motion
          </label>
          <label className="settings-menu__row">
            <input
              type="checkbox"
              checked={app.diagnosticsOpen}
              onChange={(event) => app.setDiagnosticsOpen(event.target.checked)}
            />
            Developer diagnostics
          </label>
          <label className="settings-menu__row">
            <input
              type="checkbox"
              checked={app.perfOpen}
              onChange={(event) => app.setPerfOpen(event.target.checked)}
            />
            Performance overlay
          </label>
          <div className="settings-menu__row settings-menu__note">
            Release policy: <code>{RELEASE_POLICY}</code>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TopBar() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const setHelpOpen = useAppStore((s) => s.setHelpOpen);
  const status = useDataStore((s) => s.status);
  const index = useDataStore((s) => s.index);
  const bundles = useRegistryStore((s) => s.bundles);

  const readyCount = Object.values(bundles).filter((b) => b.state === 'ready').length;
  const loadingCount = Object.values(bundles).filter(
    (b) => b.state === 'loadingGeometry' || b.state === 'loadingManifest' || b.state === 'queued',
  ).length;
  const errorCount = Object.values(bundles).filter((b) => b.state === 'error').length;

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__title">Anatomy Atlas</span>
        {index?.release_stage === 'development_fixture' ? (
          <Badge tone="warning" title="All data on screen is a synthetic development fixture">
            DEV FIXTURE
          </Badge>
        ) : null}
      </div>
      <nav className="topbar__modes" aria-label="Application mode">
        {MODES.map((entry) => (
          <Button
            key={entry.mode}
            active={mode === entry.mode}
            aria-current={mode === entry.mode ? 'page' : undefined}
            onClick={() => setMode(entry.mode)}
            data-testid={`mode-${entry.mode}`}
          >
            {entry.label}
          </Button>
        ))}
      </nav>
      <SearchBox />
      <div className="topbar__status" data-testid="load-status" aria-live="polite">
        {status === 'loading' ? <Badge tone="info">loading data…</Badge> : null}
        {status === 'error' ? <Badge tone="danger">data error</Badge> : null}
        {status === 'ready' ? (
          <Badge tone={errorCount > 0 ? 'danger' : loadingCount > 0 ? 'info' : 'success'}>
            {readyCount} bundle{readyCount === 1 ? '' : 's'} ready
            {loadingCount > 0 ? `, ${loadingCount} loading` : ''}
            {errorCount > 0 ? `, ${errorCount} failed` : ''}
          </Badge>
        ) : null}
      </div>
      <div className="topbar__actions">
        <Button onClick={() => setHelpOpen(true)} title="Keyboard and mouse controls (?)">
          Help
        </Button>
        <SettingsMenu />
      </div>
    </header>
  );
}
