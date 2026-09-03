// Physically based "living tissue" material with the IBD shader chunks injected.

import { Color, MeshPhysicalMaterial, Vector4 } from 'three';
import type { IUniform, WebGLProgramParametersWithUniforms } from 'three';
import { CROHNS_LESIONS } from './conditions.ts';
import type { Lesion, TubeKey } from './conditions.ts';
import { TISSUE_COLORS } from './config.ts';
import type { SceneState } from './timeline.ts';
import {
  FRAGMENT_COLOR, FRAGMENT_EMISSIVE, FRAGMENT_NORMAL, FRAGMENT_PARS, FRAGMENT_ROUGHNESS,
  MAX_LESIONS, VERTEX_DISPLACE, VERTEX_NORMAL, VERTEX_PARS,
} from './shaders/tissue-shader.ts';

interface TubeSettings {
  isColon: number;
  haustra: number;
  waveCount: number;
  waveSpeed: number;
  peristalsisScale: number;
}

const TUBE_SETTINGS: Readonly<Record<TubeKey, TubeSettings>> = Object.freeze({
  stomach: { isColon: 0, haustra: 0, waveCount: 2.5, waveSpeed: 0.05, peristalsisScale: 0.5 },
  smallIntestine: { isColon: 0, haustra: 0, waveCount: 11, waveSpeed: 0.045, peristalsisScale: 1 },
  colon: { isColon: 1, haustra: 30, waveCount: 5, waveSpeed: 0.018, peristalsisScale: 0.7 },
});

export type TissueUniforms = Record<string, IUniform>;

export interface TissueMaterial extends MeshPhysicalMaterial {
  userData: { uniforms: TissueUniforms; peristalsisScale: number };
}

function lesionVec4s(lesions: readonly Lesion[]): Vector4[] {
  const out: Vector4[] = [];
  for (let i = 0; i < MAX_LESIONS; i++) {
    const l = lesions[i];
    out.push(l ? new Vector4(l.center, l.halfWidth, l.intensity, l.delay) : new Vector4());
  }
  return out;
}

export function createTissueMaterial({ tubeKey, curveLength }: { tubeKey: TubeKey; curveLength: number }): TissueMaterial {
  const settings = TUBE_SETTINGS[tubeKey];
  const lesions = CROHNS_LESIONS[tubeKey] ?? [];
  const uniforms: TissueUniforms = {
    uTime: { value: 0 },
    uPeristalsis: { value: 1 },
    uHaustra: { value: settings.haustra },
    uLength: { value: curveLength },
    uWaveCount: { value: settings.waveCount },
    uWaveSpeed: { value: settings.waveSpeed },
    uLesions: { value: lesionVec4s(lesions) },
    uLesionCount: { value: lesions.length },
    uCrohns: { value: 0 },
    uUc: { value: 0 },
    uUcExtent: { value: 0 },
    uIsColon: { value: settings.isColon },
    uFlare: { value: 0 },
    uHealthyColor: { value: new Color(TISSUE_COLORS.healthy) },
    uHealthyDeep: { value: new Color(TISSUE_COLORS.healthyDeep) },
    uInflamedColor: { value: new Color(TISSUE_COLORS.inflamed) },
    uDuskyColor: { value: new Color(TISSUE_COLORS.dusky) },
    uUlcerColor: { value: new Color(TISSUE_COLORS.ulcer) },
    uFatColor: { value: new Color(TISSUE_COLORS.fat) },
    uRimHealthy: { value: new Color(TISSUE_COLORS.rimHealthy) },
    uRimInflamed: { value: new Color(TISSUE_COLORS.rimInflamed) },
  };

  const material = new MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.62,
    metalness: 0.0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.5,
    sheen: 0.35,
    sheenRoughness: 0.8,
    sheenColor: new Color('#f2b8a8'),
    envMapIntensity: 0.3,
  }) as TissueMaterial;

  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_PARS}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\n${VERTEX_NORMAL}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERTEX_DISPLACE}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_PARS}`)
      .replace('#include <color_fragment>', FRAGMENT_COLOR)
      .replace('#include <roughnessmap_fragment>', FRAGMENT_ROUGHNESS)
      .replace('#include <normal_fragment_maps>', FRAGMENT_NORMAL)
      .replace('#include <emissivemap_fragment>', FRAGMENT_EMISSIVE);
  };
  // Distinct cache key per tube so three.js does not share a program across different lesion counts.
  material.customProgramCacheKey = () => `ibd-tissue-${tubeKey}`;
  material.userData = { uniforms, peristalsisScale: settings.peristalsisScale };
  return material;
}

/** Pushes timeline state into a tissue material each frame. */
export function updateTissueMaterial(material: TissueMaterial, state: SceneState, time: number, peristalsis = 1): void {
  const u = material.userData.uniforms;
  u.uTime.value = time;
  u.uPeristalsis.value = peristalsis * material.userData.peristalsisScale;
  u.uCrohns.value = state.crohns;
  u.uUc.value = state.uc;
  u.uUcExtent.value = state.ucExtent;
  u.uFlare.value = state.flare;
}
