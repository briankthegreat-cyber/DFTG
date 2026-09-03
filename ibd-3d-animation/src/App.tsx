import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createCurves } from '@/ibd/anatomy-paths.ts';
import { detectQuality, prefersReducedMotion, readOptions } from '@/ibd/config.ts';
import { clamp } from '@/ibd/math-utils.ts';
import { stateAt, timeForChapter, TOTAL_DURATION } from '@/ibd/timeline.ts';
import { useAutoPause, useIframeSizeReport } from '@/hooks/use-embed-behaviour.ts';
import { installCaptureApi } from '@/scene/capture.ts';
import { IbdCanvas } from '@/scene/IbdCanvas.tsx';
import { SceneContext } from '@/scene/scene-context.ts';
import type { SceneContextValue } from '@/scene/scene-context.ts';
import { player } from '@/store/player.ts';
import { Fallback } from '@/ui/Fallback.tsx';
import { Overlay } from '@/ui/Overlay.tsx';

const FIXED_DELTA = 1 / 30;

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function App() {
  const options = useMemo(() => readOptions(window.location.search), []);
  const quality = useMemo(() => options.quality ?? detectQuality(), [options.quality]);
  const curves = useMemo(() => createCurves(), []);
  const initialTime = useMemo(() => {
    const raw = options.t !== null ? options.t : options.chapter ? timeForChapter(options.chapter) + 0.01 : 0;
    return clamp(raw, 0, TOTAL_DURATION - 1e-3);
  }, [options]);
  const sceneState = useRef(stateAt(initialTime));
  const meshes = useRef<SceneContextValue['meshes']['current']>({});
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [labelEl, setLabelEl] = useState<HTMLDivElement | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);

  useEffect(() => {
    player.set({
      time: initialTime,
      playing: options.autoplay && !options.capture,
      reducedMotion: prefersReducedMotion(),
      loop: options.loop,
    });
    if (options.capture) installCaptureApi();
    if (!webglAvailable()) setFallback('Your browser could not start the 3D view.');
  }, [options, initialTime]);

  useAutoPause(stageRef, !options.capture);
  useIframeSizeReport();

  const labelRefCallback = useCallback((el: HTMLDivElement | null) => setLabelEl(el), []);

  const ctx = useMemo<SceneContextValue>(() => ({
    curves, options, quality, theme: options.theme, sceneState, meshes, fixedDelta: FIXED_DELTA, stageRef,
  }), [curves, options, quality]);

  return (
    <SceneContext.Provider value={ctx}>
      <div ref={stageRef} className="ibd-root relative h-full w-full overflow-hidden select-none" data-ibd-theme={options.theme} data-quality={quality}>
        {fallback ? (
          <Fallback message={fallback} />
        ) : (
          <>
            <IbdCanvas labelContainer={{ current: labelEl }} onContextLost={() => setFallback('The 3D view stopped because your device ran low on graphics memory.')} />
            <div className="stage-vignette grain" aria-hidden="true" />
            <div ref={labelRefCallback} className="pointer-events-none absolute inset-0" />
          </>
        )}
        {options.ui && !fallback && <Overlay />}
      </div>
    </SceneContext.Provider>
  );
}
