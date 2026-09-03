import { Canvas } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { QUALITY } from '@/ibd/config.ts';
import { markReady } from './capture.ts';
import { Backdrop } from './Backdrop.tsx';
import { CameraRigController } from './CameraRigController.tsx';
import { CaptureBridge } from './CaptureBridge.tsx';
import { Clock } from './Clock.tsx';
import { Effects } from './Effects.tsx';
import { ImmuneParticles } from './ImmuneParticles.tsx';
import { Labels } from './Labels.tsx';
import { Lights } from './Lights.tsx';
import { Tract } from './Tract.tsx';
import { useSceneContext } from './scene-context.ts';

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => onReady());
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  return null;
}

export function IbdCanvas({ labelContainer, onContextLost }: { labelContainer: MutableRefObject<HTMLDivElement | null>; onContextLost: () => void }) {
  const { quality, options } = useSceneContext();
  const q = QUALITY[quality];
  const lostCount = useRef(0);

  return (
    <Canvas
      shadows={q.shadows ? { type: 2 } : false}
      dpr={[1, q.maxPixelRatio]}
      flat={q.bloom}
      frameloop={options.capture ? 'demand' : 'always'}
      gl={{ antialias: !q.bloom, powerPreference: 'high-performance', stencil: false, alpha: false }}
      camera={{ fov: 30, near: 0.5, far: 200, position: [6.5, 3, 25] }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          lostCount.current += 1;
          if (lostCount.current >= 2) onContextLost();
        });
      }}
      style={{ position: 'absolute', inset: 0, touchAction: 'pan-y' }}
      aria-label="3D animation of the digestive tract showing inflammatory bowel disease"
      role="img"
    >
      <Clock />
      <Backdrop />
      <Lights />
      <Tract />
      <ImmuneParticles />
      <CameraRigController />
      <Labels container={labelContainer.current} />
      <Effects />
      {options.capture && <CaptureBridge id="main" />}
      <Ready onReady={markReady} />
    </Canvas>
  );
}
