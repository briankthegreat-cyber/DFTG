import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { QUALITY } from '@/ibd/config.ts';
import { useSceneContext } from './scene-context.ts';

/** Subtle bloom on the glowing inflamed tissue, soft vignette and filmic tone mapping. */
export function Effects() {
  const { quality } = useSceneContext();
  const q = QUALITY[quality];
  if (!q.bloom) return null;
  return (
    <EffectComposer multisampling={q.msaaSamples} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.32} luminanceThreshold={0.82} luminanceSmoothing={0.25} radius={0.6} />
      <Vignette eskil={false} offset={0.22} darkness={0.5} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
