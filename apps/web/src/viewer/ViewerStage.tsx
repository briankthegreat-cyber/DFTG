import { useMemo, useState } from 'react';
import { AnatomyCanvas, ViewerErrorBoundary, useSelectionStore } from '@anatomy/viewer';
import { currentQuestion } from '@anatomy/core';
import { EmptyState } from '@anatomy/ui';
import {
  labelAnchorFor,
  labelFor,
  registry,
  resolveStructureMeta,
  selectStructure,
} from '../controller';
import { useAppStore, useUiStore } from '../state/app';
import { useQuizStore } from '../state/quiz';

let webgl2Support: boolean | null = null;
function hasWebGl2(): boolean {
  if (webgl2Support === null) {
    try {
      webgl2Support = document.createElement('canvas').getContext('webgl2') !== null;
    } catch {
      webgl2Support = false;
    }
  }
  return webgl2Support;
}

interface HoverInfo {
  structureId: string;
  clientX: number;
  clientY: number;
}

/**
 * The shared 3D stage. Explore and Learn use default picking; quiz mode
 * routes identify-on-model clicks into the quiz engine instead of selection.
 */
export function ViewerStage({ quizMode = false }: { quizMode?: boolean }) {
  const quality = useAppStore((s) => s.quality);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const hoverEnabled = useAppStore((s) => s.hoverEnabled);
  const contextLost = useAppStore((s) => s.contextLost);
  const setContextLost = useAppStore((s) => s.setContextLost);
  const selectedStructureId = useSelectionStore((s) => s.selectedStructureId);
  const labeledStructureIds = useUiStore((s) => s.labeledStructureIds);
  const session = useQuizStore((s) => s.session);
  const lastResult = useQuizStore((s) => s.lastResult);
  const answerWith = useQuizStore((s) => s.answerWith);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const labels = useMemo(() => {
    const ids = new Set<string>(labeledStructureIds);
    if (selectedStructureId) ids.add(selectedStructureId);
    return [...ids].map((structureId) => ({ structureId, text: labelFor(structureId) }));
  }, [labeledStructureIds, selectedStructureId]);

  const extraHighlights = useMemo(
    () => (quizMode && lastResult ? lastResult.correct_structure_ids : undefined),
    [quizMode, lastResult],
  );

  if (!hasWebGl2()) {
    return (
      <div className="viewer-stage" data-testid="viewer-stage">
        <EmptyState
          title="3D view unavailable"
          hint="This browser does not provide WebGL2, which the anatomy viewer requires. The hierarchy, search, and structure details remain fully usable."
        />
      </div>
    );
  }

  return (
    <div className="viewer-stage" data-testid="viewer-stage">
      <ViewerErrorBoundary
        fallback={
          <EmptyState
            title="The 3D viewer hit an unexpected error"
            hint="Reload the page to restart it. Search and hierarchy still work."
          />
        }
      >
        <AnatomyCanvas
          registry={registry}
          resolveStructure={resolveStructureMeta}
          quality={quality}
          reducedMotion={reducedMotion}
          hoverEnabled={hoverEnabled && !quizMode}
          onPick={
            quizMode
              ? (info) => {
                  if (!session || session.phase !== 'question') return true;
                  const question = currentQuestion(session);
                  if (question?.type === 'identify_on_model') {
                    answerWith(info.structureId);
                    return true;
                  }
                  return true;
                }
              : undefined
          }
          onEmptyClick={quizMode ? () => session?.phase === 'question' : undefined}
          onHoverInfo={setHoverInfo}
          extraHighlightStructureIds={extraHighlights}
          suppressSelectionHighlight={quizMode && session?.phase === 'question'}
          labels={quizMode ? [] : labels}
          labelAnchorFor={labelAnchorFor}
          onLabelClick={(structureId) => selectStructure(structureId, 'label')}
          onContextLost={() => setContextLost(true)}
          onContextRestored={() => setContextLost(false)}
        />
      </ViewerErrorBoundary>
      {contextLost ? (
        <div className="stage-overlay" role="alert">
          <p>
            The graphics context was lost (this can happen when the GPU is busy). Waiting for the
            browser to restore it — if this message stays, reload the page.
          </p>
        </div>
      ) : null}
      {hoverInfo && !quizMode ? (
        <div
          className="hover-tooltip"
          style={{ left: hoverInfo.clientX + 12, top: hoverInfo.clientY + 12 }}
          aria-hidden="true"
        >
          {labelFor(hoverInfo.structureId)}
        </div>
      ) : null}
    </div>
  );
}
