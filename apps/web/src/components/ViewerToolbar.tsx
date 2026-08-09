import { useRef } from 'react';
import { Button } from '@anatomy/ui';
import {
  snapshotVisibility,
  useCameraStore,
  useSelectionStore,
  useVisibilityStore,
  type VisibilitySnapshot,
} from '@anatomy/viewer';
import { hideSelected, isolateSelected, peelSelected } from '../controller';

const VIEWS = [
  { view: 'anterior', label: 'A', title: 'Anterior view' },
  { view: 'posterior', label: 'P', title: 'Posterior view' },
  { view: 'left', label: 'L', title: 'Patient-left view' },
  { view: 'right', label: 'R', title: 'Patient-right view' },
  { view: 'superior', label: 'S', title: 'Superior view' },
  { view: 'inferior', label: 'I', title: 'Inferior view' },
] as const;

/** Compact toolbar under the 3D canvas: views, visibility actions, undo/redo. */
export function ViewerToolbar() {
  const camera = useCameraStore();
  const visibility = useVisibilityStore();
  const selectedStructureId = useSelectionStore((s) => s.selectedStructureId);
  // One undo entry per slider gesture, captured before the first preview tick.
  const fadeGestureStart = useRef<VisibilitySnapshot | null>(null);

  const endFadeGesture = () => {
    if (fadeGestureStart.current) {
      visibility.commitSnapshot(fadeGestureStart.current);
      fadeGestureStart.current = null;
    }
  };

  return (
    <div className="viewer-toolbar" role="toolbar" aria-label="Viewer controls">
      <div className="viewer-toolbar__group" aria-label="Canonical views">
        {VIEWS.map((entry) => (
          <Button
            key={entry.view}
            size="sm"
            title={entry.title}
            onClick={() => camera.requestView(entry.view)}
            data-testid={`view-${entry.view}`}
          >
            {entry.label}
          </Button>
        ))}
        <Button size="sm" title="Fit visible structures" onClick={() => camera.requestFitVisible()}>
          Fit
        </Button>
        <Button
          size="sm"
          title="Reset camera to the whole body"
          onClick={() => camera.requestReset()}
          data-testid="btn-reset-camera"
        >
          Reset view
        </Button>
      </div>
      <div className="viewer-toolbar__group" aria-label="Visibility actions">
        <Button
          size="sm"
          disabled={!selectedStructureId}
          onClick={hideSelected}
          data-testid="btn-hide"
          title="Hide selected structure (H)"
        >
          Hide
        </Button>
        <Button
          size="sm"
          disabled={!selectedStructureId}
          onClick={isolateSelected}
          data-testid="btn-isolate"
          title="Show only the selected structure (I)"
        >
          Isolate
        </Button>
        <Button
          size="sm"
          disabled={!selectedStructureId}
          onClick={peelSelected}
          title="Peel the selected layer away (undoable)"
          data-testid="btn-peel"
        >
          Peel
        </Button>
        <Button
          size="sm"
          active={visibility.isolatedStructureIds !== null}
          disabled={visibility.isolatedStructureIds === null}
          onClick={() => visibility.clearIsolation()}
          data-testid="btn-clear-isolation"
        >
          Exit isolation
        </Button>
        <Button
          size="sm"
          active={visibility.fadeOthers}
          onClick={() => visibility.setFade(!visibility.fadeOthers)}
          title="Fade everything except the selection"
          data-testid="btn-fade"
        >
          Fade others
        </Button>
        <label className="viewer-toolbar__slider">
          <span className="sr-only">Fade opacity</span>
          <input
            type="range"
            min={0.05}
            max={0.6}
            step={0.05}
            value={visibility.fadeOpacity}
            disabled={!visibility.fadeOthers}
            onChange={(event) => {
              if (!fadeGestureStart.current) {
                fadeGestureStart.current = snapshotVisibility(useVisibilityStore.getState());
              }
              visibility.previewFade(Number(event.target.value));
            }}
            onPointerUp={endFadeGesture}
            onKeyUp={endFadeGesture}
            onBlur={endFadeGesture}
            aria-label="Fade opacity"
          />
        </label>
        <Button
          size="sm"
          active={visibility.xray}
          onClick={() => visibility.setXray(!visibility.xray)}
          title="X-ray context mode"
          data-testid="btn-xray"
        >
          X-ray
        </Button>
      </div>
      <div className="viewer-toolbar__group" aria-label="History">
        <Button
          size="sm"
          disabled={visibility.past.length === 0}
          onClick={() => visibility.undo()}
          data-testid="btn-undo"
          title="Undo visibility change (Ctrl+Z)"
        >
          Undo
        </Button>
        <Button
          size="sm"
          disabled={visibility.future.length === 0}
          onClick={() => visibility.redo()}
          data-testid="btn-redo"
          title="Redo visibility change (Ctrl+Y)"
        >
          Redo
        </Button>
        <Button
          size="sm"
          onClick={() => visibility.resetAll()}
          data-testid="btn-reset-visibility"
          title="Reset all visibility state (R)"
        >
          Reset visibility
        </Button>
      </div>
    </div>
  );
}
