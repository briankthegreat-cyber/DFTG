import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { QUALITY, STAGE_THEMES } from '@/ibd/config.ts';
import { useSceneContext } from './scene-context.ts';

/** Studio-style three-point lighting plus a generated room environment for reflections. */
export function Lights() {
  const { theme, quality } = useSceneContext();
  const t = STAGE_THEMES[theme];
  const q = QUALITY[quality];
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    pmrem.dispose();
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      <hemisphereLight args={[t.hemiSky, t.hemiGround, 0.32]} />
      <directionalLight
        color={t.keyLight}
        intensity={2.2}
        position={[9, 12, 14]}
        castShadow={q.shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={4}
        shadow-camera-far={60}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0008}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />
      <directionalLight color={t.fillLight} intensity={0.45} position={[-12, 2, 8]} />
      <directionalLight color={t.rimLight} intensity={1.3} position={[-4, 8, -12]} />
      <fog attach="fog" args={[t.fog, 22, 60]} />
    </>
  );
}
