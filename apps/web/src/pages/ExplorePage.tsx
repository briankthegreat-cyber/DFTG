import { useAppStore } from '../state/app';
import { Button } from '@anatomy/ui';
import { ViewerStage } from '../viewer/ViewerStage';
import { DetailsPanel } from '../components/DetailsPanel';
import { HierarchyTree } from '../components/HierarchyTree';
import { SystemsPanel } from '../components/SystemsPanel';
import { ViewerToolbar } from '../components/ViewerToolbar';
import { LoadProgress } from '../components/Overlays';

/** Free exploration: systems + hierarchy on the left, canvas center, details right. */
export function ExplorePage() {
  const leftPanelOpen = useAppStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useAppStore((s) => s.rightPanelOpen);
  const setLeftPanelOpen = useAppStore((s) => s.setLeftPanelOpen);
  const setRightPanelOpen = useAppStore((s) => s.setRightPanelOpen);

  return (
    <div
      className={`layout${leftPanelOpen ? ' layout--left' : ''}${rightPanelOpen ? ' layout--right' : ''}`}
    >
      <div className="layout__panel-toggles">
        <Button
          size="sm"
          active={leftPanelOpen}
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          aria-label={`${leftPanelOpen ? 'Close' : 'Open'} systems and hierarchy panel`}
        >
          Systems
        </Button>
        <Button
          size="sm"
          active={rightPanelOpen}
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          aria-label={`${rightPanelOpen ? 'Close' : 'Open'} structure details panel`}
        >
          Details
        </Button>
      </div>
      {leftPanelOpen ? (
        <aside className="layout__left" aria-label="Systems and hierarchy">
          <SystemsPanel />
          <HierarchyTree />
        </aside>
      ) : null}
      <main className="layout__center" aria-label="3D viewer">
        <ViewerStage />
        <ViewerToolbar />
        <LoadProgress />
      </main>
      {rightPanelOpen ? (
        <aside className="layout__right" aria-label="Structure details">
          <DetailsPanel />
        </aside>
      ) : null}
    </div>
  );
}
