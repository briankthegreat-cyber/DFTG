// Pure model of how inflammation is distributed along the digestive tract for
// each condition. The GLSL in tissue.frag mirrors these functions exactly so the
// CPU (labels, particles, tests) and GPU (shading) agree.
//
// Path parameter conventions (u runs 0 -> 1 along each tube):
//   stomach:        0 = cardia (top), 1 = pylorus
//   smallIntestine: 0 = duodenum,     1 = ileocecal valve (terminal ileum ends here)
//   colon:          0 = cecum,        1 = anal canal (rectum is roughly 0.9 - 1)

import { clamp, smoothstep } from './math-utils.ts';

export type TubeKey = 'stomach' | 'smallIntestine' | 'colon';

export interface Lesion {
  /** Centre of the patch along the tube (0..1). */
  center: number;
  /** Half the length of the fully developed patch, in path units. */
  halfWidth: number;
  /** Peak inflammation (0..1). */
  intensity: number;
  /** Global progress at which this patch starts to appear (0..1). */
  delay: number;
  label?: string;
}

export interface ConditionState {
  crohns: number;
  uc: number;
  ucExtent: number;
}

export interface UcStage {
  extent: number;
  id: string;
  name: string;
  detail: string;
}

export const MAX_LESIONS = 8;

/** Duration (in progress units) over which a single lesion grows to full size. */
const LESION_GROWTH = 0.35;

/**
 * Crohn's disease: patchy "skip lesions" with healthy bowel in between.
 * The terminal ileum is the classic and most intense site. Rectum is spared
 * (colon lesions stay below u = 0.88). Patches also occur in the cecum,
 * transverse and descending colon to show that any segment can be involved.
 */
export const CROHNS_LESIONS: Readonly<Record<TubeKey, readonly Lesion[]>> = Object.freeze({
  stomach: Object.freeze([] as Lesion[]),
  smallIntestine: Object.freeze([
    { center: 0.94, halfWidth: 0.055, intensity: 1.0, delay: 0.0, label: 'Terminal ileum' },
    { center: 0.62, halfWidth: 0.028, intensity: 0.8, delay: 0.32 },
    { center: 0.34, halfWidth: 0.02, intensity: 0.6, delay: 0.5 },
  ]),
  colon: Object.freeze([
    { center: 0.06, halfWidth: 0.045, intensity: 0.9, delay: 0.14, label: 'Cecum & ascending colon' },
    { center: 0.47, halfWidth: 0.035, intensity: 0.7, delay: 0.42 },
    { center: 0.73, halfWidth: 0.03, intensity: 0.65, delay: 0.58 },
  ]),
});

/**
 * Ulcerative colitis: continuous inflammation that begins in the rectum and
 * extends proximally. `extent` is the fraction of the colon involved,
 * measured from the anal end.
 */
export const UC_STAGES: readonly UcStage[] = Object.freeze([
  { extent: 0.12, id: 'proctitis', name: 'Proctitis', detail: 'Rectum only' },
  { extent: 0.5, id: 'left-sided', name: 'Left-sided colitis', detail: 'Up to the splenic flexure' },
  { extent: 0.97, id: 'extensive', name: 'Extensive colitis (pancolitis)', detail: 'Most or all of the colon' },
]);

/** Softness of the advancing UC front, in path units. */
export const UC_FEATHER = 0.03;

/** How far a single lesion has developed (0..1) at a given global progress. */
export function lesionActivation(lesion: Lesion, progress: number): number {
  return smoothstep(lesion.delay, lesion.delay + LESION_GROWTH, progress);
}

/** Inflammation (0..1) at path position `u` from a set of patchy lesions. */
export function lesionMask(u: number, lesions: readonly Lesion[], progress: number): number {
  let mask = 0;
  for (const lesion of lesions) {
    const act = lesionActivation(lesion, progress);
    if (act <= 0) continue;
    const reach = lesion.halfWidth * act;
    const d = Math.abs(u - lesion.center);
    // Full intensity in the core, soft shoulder toward the edge of the patch.
    const falloff = 1 - smoothstep(reach * 0.45, reach, d);
    mask = Math.max(mask, falloff * lesion.intensity * act);
  }
  return clamp(mask, 0, 1);
}

/** Continuous UC inflammation at colon position `u` for a given extent. */
export function ucMask(u: number, extent: number, feather: number = UC_FEATHER): number {
  if (extent <= 0) return 0;
  const front = 1 - clamp(extent, 0, 1);
  return smoothstep(front - feather, front + feather, u);
}

/** The furthest named UC extent reached, or null when nothing is inflamed. */
export function ucStage(extent: number): UcStage | null {
  let reached: UcStage | null = null;
  for (const stage of UC_STAGES) {
    if (extent >= stage.extent - 1e-9) reached = stage;
  }
  return reached;
}

/**
 * Combined inflammation for one tube at position u.
 * `state` carries { crohns: 0..1, uc: 0..1, ucExtent: 0..1 }.
 */
export function inflammation(tubeKey: TubeKey, u: number, state: ConditionState): { crohns: number; uc: number; total: number } {
  const crohns = state.crohns > 0
    ? lesionMask(u, CROHNS_LESIONS[tubeKey] ?? [], state.crohns)
    : 0;
  const uc = tubeKey === 'colon' && state.uc > 0
    ? ucMask(u, state.ucExtent) * state.uc
    : 0;
  return { crohns, uc, total: clamp(Math.max(crohns, uc), 0, 1) };
}

/** Packs lesions into a flat vec4 array [center, halfWidth, intensity, delay] for the shader. */
export function lesionUniformArray(lesions: readonly Lesion[]): Float32Array {
  const arr = new Float32Array(MAX_LESIONS * 4);
  lesions.slice(0, MAX_LESIONS).forEach((lesion, i) => {
    arr[i * 4 + 0] = lesion.center;
    arr[i * 4 + 1] = lesion.halfWidth;
    arr[i * 4 + 2] = lesion.intensity;
    arr[i * 4 + 3] = lesion.delay;
  });
  return arr;
}
