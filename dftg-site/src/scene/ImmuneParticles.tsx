import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { QUALITY } from '@/ibd/config.ts';
import { createImmuneParticles } from '@/ibd/immune-particles.ts';
import { player } from '@/store/player.ts';
import { useSceneContext } from './scene-context.ts';

export function ImmuneParticles() {
  const { curves, quality, sceneState } = useSceneContext();
  const height = useThree((s) => s.size.height);
  const dpr = useThree((s) => s.viewport.dpr);
  const particles = useMemo(() => createImmuneParticles({ curves, count: QUALITY[quality].particles }), [curves, quality]);

  useEffect(() => {
    particles.setViewportHeight(height * dpr);
  }, [particles, height, dpr]);
  useEffect(() => () => particles.dispose(), [particles]);

  useFrame(() => {
    const s = sceneState.current;
    particles.update(s, s.time, !player.get().reducedMotion);
  });

  return <primitive object={particles.object} />;
}
