import { createContext, useContext } from 'react';
import type { MutableRefObject } from 'react';
import type { Mesh } from 'three';
import type { Curves } from '@/ibd/anatomy-paths.ts';
import type { TubeKey } from '@/ibd/conditions.ts';
import type { Options, QualityKey, ThemeKey } from '@/ibd/config.ts';
import type { SceneState } from '@/ibd/timeline.ts';

export interface SceneContextValue {
  curves: Curves;
  options: Options;
  quality: QualityKey;
  theme: ThemeKey;
  /** Latest timeline state, refreshed once per frame by <Clock>. */
  sceneState: MutableRefObject<SceneState>;
  meshes: MutableRefObject<Partial<Record<TubeKey, Mesh>>>;
  /** Fixed timestep used in capture mode so renders are deterministic. */
  fixedDelta: number;
  stageRef: MutableRefObject<HTMLDivElement | null>;
}

export const SceneContext = createContext<SceneContextValue | null>(null);

export function useSceneContext(): SceneContextValue {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('SceneContext missing');
  return ctx;
}
