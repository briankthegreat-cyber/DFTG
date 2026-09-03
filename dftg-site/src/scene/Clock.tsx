import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { stateAt } from '@/ibd/timeline.ts';
import { ucStage } from '@/ibd/conditions.ts';
import { player } from '@/store/player.ts';
import { useSceneContext } from './scene-context.ts';

/** Advances playback and refreshes the shared scene state before anything else renders. */
export function Clock() {
  const { sceneState, options, fixedDelta } = useSceneContext();
  const lastKey = useRef('');
  useFrame((_, delta) => {
    const dt = options.capture ? fixedDelta : Math.min(delta, 0.05);
    if (!options.capture) player.tick(dt);
    const s = stateAt(player.get().time);
    sceneState.current = s;
    const key = `${s.chapterIndex}:${s.insetMode}:${s.uc > 0.05 ? ucStage(s.ucExtent)?.id ?? '' : ''}`;
    if (key !== lastKey.current) {
      lastKey.current = key;
      player.notify();
    }
  }, -10);
  return null;
}
