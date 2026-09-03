import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { radiusProfile, SEGMENTS } from '@/ibd/anatomy-paths.ts';
import type { TubeKey } from '@/ibd/conditions.ts';
import { QUALITY } from '@/ibd/config.ts';
import { buildTubeGeometry } from '@/ibd/tube-geometry.ts';
import { createTissueMaterial, updateTissueMaterial } from '@/ibd/tissue-material.ts';
import { player } from '@/store/player.ts';
import { useSceneContext } from './scene-context.ts';

/** The stomach, small intestine and colon as displaced, shaded tubes. */
export function Tract() {
  const { curves, quality, sceneState, meshes } = useSceneContext();
  const q = QUALITY[quality];

  const parts = useMemo(() => {
    return (Object.keys(SEGMENTS) as TubeKey[]).map((key) => ({
      key,
      geometry: buildTubeGeometry(curves[key], {
        tubular: q[key].tubular,
        radial: q[key].radial,
        radiusAt: (u) => radiusProfile(key, u),
      }),
      material: createTissueMaterial({ tubeKey: key, curveLength: curves[key].getLength() }),
    }));
  }, [curves, q]);

  useEffect(() => () => {
    for (const p of parts) {
      p.geometry.dispose();
      p.material.dispose();
    }
  }, [parts]);

  useFrame(() => {
    const s = sceneState.current;
    const peristalsis = player.get().reducedMotion ? 0 : 1;
    for (const p of parts) updateTissueMaterial(p.material, s, s.time, peristalsis);
  });

  return (
    <group>
      {parts.map((p) => (
        <mesh
          key={p.key}
          name={p.key}
          geometry={p.geometry}
          material={p.material}
          castShadow={q.shadows}
          receiveShadow={q.shadows}
          frustumCulled={false}
          ref={(m: Mesh | null) => {
            if (m) meshes.current[p.key] = m;
            else delete meshes.current[p.key];
          }}
        />
      ))}
    </group>
  );
}
