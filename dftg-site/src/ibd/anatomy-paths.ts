// Stylised but anatomically ordered digestive tract, authored as Catmull-Rom
// control points. Coordinates are in "abdomen units" viewed from the front:
//   +x = viewer's right = patient's LEFT,  +y = up (toward the head),  +z = toward the viewer.
// So the stomach and descending colon sit on the viewer's right, and the cecum,
// ascending colon and terminal ileum on the viewer's left, exactly as in an
// anterior anatomical illustration.

import { CatmullRomCurve3, Vector3 } from 'three';
import { smoothstep } from './math-utils.ts';
import type { TubeKey } from './conditions.ts';

export type Vec3 = [number, number, number];
export interface Segment { points: Vec3[] }
export interface Landmark { tube: TubeKey; point: Vec3 }
export type Curves = Record<TubeKey, CatmullRomCurve3>;

export const SEGMENTS: Readonly<Record<TubeKey, Segment>> = Object.freeze({
  stomach: {
    // u: 0 = lower esophagus (top), ~0.1 = cardia, fundus bulge just after, 1 = pylorus
    points: [
      [0.25, 7.3, 0.05],
      [0.35, 6.6, 0.15],
      [0.6, 6.15, 0.28],
      [1.6, 6.05, 0.38],
      [2.55, 5.5, 0.45],
      [2.55, 4.5, 0.55],
      [1.7, 3.6, 0.6],
      [0.7, 3.35, 0.6],
      [-0.1, 3.5, 0.5],
    ],
  },
  smallIntestine: {
    // u: 0 = duodenum (just past the pylorus), 1 = ileocecal valve
    points: [
      [0.45, 3.4, 0.55],
      [-0.4, 3.45, 0.42],
      [-1.2, 3.1, 0.2],
      [-1.9, 2.2, 0.05],
      [-1.4, 1.2, 0.2],
      [-0.2, 0.9, 0.45],
      [1.0, 1.4, 0.95],
      [2.3, 0.9, 0.7],
      [2.2, -0.2, 1.05],
      [0.9, 0.1, 0.85],
      [-0.6, 0.5, 1.05],
      [-2.0, 0.0, 0.7],
      [-1.9, -1.1, 1.05],
      [-0.4, -0.8, 0.8],
      [1.2, -1.2, 1.05],
      [2.4, -1.8, 0.7],
      [1.8, -2.8, 1.05],
      [0.3, -2.4, 0.85],
      [-1.2, -2.0, 1.05],
      [-2.3, -2.7, 0.7],
      [-1.5, -3.5, 1.0],
      [0.0, -3.3, 0.85],
      [1.4, -3.8, 0.7],
      [0.3, -3.95, 1.0],
      [-1.3, -3.7, 0.9],
      [-2.5, -3.3, 0.6],
      [-3.3, -3.45, 0.35],
      [-3.75, -3.7, 0.3],
    ],
  },
  colon: {
    // u: 0 = cecum, 1 = anal canal. Rectum is roughly u = 0.9 - 1.
    points: [
      [-3.7, -4.3, 0.3],
      [-3.75, -3.4, 0.3],
      [-3.95, -2.0, 0.22],
      [-3.75, -0.5, 0.3],
      [-3.9, 1.0, 0.22],
      [-3.75, 2.05, 0.28],
      [-3.3, 2.5, 0.4],
      [-2.6, 2.55, 0.55],
      [-1.2, 2.2, 0.8],
      [0.2, 2.0, 0.85],
      [1.6, 2.3, 0.7],
      [2.9, 2.75, 0.45],
      [3.55, 3.15, 0.3],
      [3.9, 2.6, 0.25],
      [3.95, 1.6, 0.22],
      [3.75, 0.2, 0.3],
      [3.9, -1.4, 0.22],
      [3.7, -2.9, 0.3],
      [3.3, -4.0, 0.5],
      [2.2, -4.7, 0.8],
      [1.0, -4.4, 0.75],
      [0.5, -5.0, 0.45],
      [0.2, -5.7, 0.2],
      [0.05, -6.4, 0.0],
    ],
  },
});

/** Named places used by camera targets and labels. */
export const LANDMARKS: Readonly<Record<string, Landmark>> = Object.freeze({
  fundus: { tube: 'stomach', point: [1.6, 6.05, 0.38] },
  pylorus: { tube: 'stomach', point: [-0.1, 3.5, 0.5] },
  terminalIleum: { tube: 'smallIntestine', point: [-2.5, -3.3, 0.6] },
  ileocecalValve: { tube: 'smallIntestine', point: [-3.3, -3.45, 0.35] },
  cecum: { tube: 'colon', point: [-3.7, -4.3, 0.3] },
  hepaticFlexure: { tube: 'colon', point: [-3.75, 2.05, 0.28] },
  transverse: { tube: 'colon', point: [0.2, 2.0, 0.85] },
  splenicFlexure: { tube: 'colon', point: [3.55, 3.15, 0.3] },
  descending: { tube: 'colon', point: [3.85, 0.2, 0.25] },
  sigmoid: { tube: 'colon', point: [2.2, -4.7, 0.8] },
  rectum: { tube: 'colon', point: [0.2, -5.7, 0.2] },
});

const BASE_RADIUS: Readonly<Record<TubeKey, number>> = Object.freeze({ stomach: 0.9, smallIntestine: 0.3, colon: 0.44 });

/** Rounds a tube off at both ends with a true hemispherical cap of the given length (in u). */
function domeCap(u: number, capLength: number): number {
  const d = Math.min(u, 1 - u) / capLength; // 0 at the tip, 1 where the cap meets the body
  if (d >= 1) return 1;
  const t = 1 - d;
  return Math.max(Math.sqrt(Math.max(0, 1 - t * t)), 0.06);
}

/** Tube radius at path position u, in scene units. */
export function radiusProfile(tubeKey: TubeKey, u: number): number {
  const base = BASE_RADIUS[tubeKey];
  if (tubeKey === 'stomach') {
    // Narrow esophagus, then the wide fundus and body, narrowing through the antrum to the pylorus.
    const esophagus = 0.3 + 0.78 * smoothstep(0.1, 0.24, u);
    const fundus = 1.0 + 0.08 * Math.sin(Math.PI * smoothstep(0.15, 0.5, u));
    const taper = 1 - 0.6 * smoothstep(0.5, 0.95, u);
    return base * esophagus * fundus * taper * domeCap(u, 0.04);
  }
  if (tubeKey === 'colon') {
    // Cecum is the widest part; the rectum is a little narrower.
    const cecum = 1 + 0.18 * (1 - smoothstep(0.0, 0.12, u));
    const rectum = 1 - 0.12 * smoothstep(0.86, 0.96, u);
    return base * cecum * rectum * domeCap(u, 0.05);
  }
  // Small intestine: jejunum slightly wider than ileum.
  const taper = 1 - 0.12 * smoothstep(0.3, 0.9, u);
  return base * taper * domeCap(u, 0.03);
}

/** Builds Catmull-Rom curves for every segment. */
export function createCurves(): Curves {
  const curves = {} as Curves;
  for (const [key, seg] of Object.entries(SEGMENTS) as [TubeKey, Segment][]) {
    const pts = seg.points.map(([x, y, z]) => new Vector3(x, y, z));
    curves[key] = new CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    curves[key].arcLengthDivisions = 600;
  }
  return curves;
}

/** Finds the arc-length parameter u on `curve` closest to `point` ([x,y,z]). */
export function findU(curve: CatmullRomCurve3, point: Vec3, samples = 400): number {
  const target = new Vector3(point[0], point[1], point[2]);
  const probe = new Vector3();
  let bestU = 0;
  let bestD = Infinity;
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    curve.getPointAt(u, probe);
    const d = probe.distanceToSquared(target);
    if (d < bestD) {
      bestD = d;
      bestU = u;
    }
  }
  return bestU;
}

/** Resolves every landmark to { tube, u, point } using the given curves. */
export function resolveLandmarks(curves: Curves): Record<string, Landmark & { u: number }> {
  const out: Record<string, Landmark & { u: number }> = {};
  for (const [name, lm] of Object.entries(LANDMARKS)) {
    out[name] = { ...lm, u: findU(curves[lm.tube], lm.point) };
  }
  return out;
}
