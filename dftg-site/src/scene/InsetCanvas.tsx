import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { STAGE_THEMES } from '@/ibd/config.ts';
import { createCrossSectionModel } from '@/ibd/cross-section-model.ts';
import { player } from '@/store/player.ts';
import { captureFlags } from './capture.ts';
import { CaptureBridge } from './CaptureBridge.tsx';
import { useSceneContext } from './scene-context.ts';

function CrossSection() {
  const { sceneState, options, fixedDelta } = useSceneContext();
  const model = useMemo(() => createCrossSectionModel(), []);
  useEffect(() => () => model.dispose(), [model]);
  useFrame((_, delta) => {
    const dt = options.capture ? fixedDelta : Math.min(delta, 0.05);
    const s = sceneState.current;
    model.update(s, s.time, captureFlags.immediate ? 10 : dt, s.insetMode, !player.get().reducedMotion);
  });
  return <primitive object={model.group} />;
}

/** Small second canvas: the bowel wall cut across, showing which layers are involved. */
export function InsetCanvas() {
  const { theme, options } = useSceneContext();
  const t = STAGE_THEMES[theme];
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={options.capture ? 'demand' : 'always'}
      gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }}
      camera={{ fov: 32, near: 0.1, far: 20, position: [2.1, 2.5, 2.7] }}
      onCreated={({ camera }) => camera.lookAt(0, -0.05, 0)}
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <color attach="background" args={[t.insetPanel]} />
      <hemisphereLight args={['#fff4e6', '#3a2a20', 0.9]} />
      <directionalLight color="#fff3e2" intensity={2.2} position={[3, 5, 4]} />
      <directionalLight color="#ffd9a0" intensity={1.0} position={[-3, 2, -3]} />
      <CrossSection />
      {options.capture && <CaptureBridge id="inset" />}
    </Canvas>
  );
}
