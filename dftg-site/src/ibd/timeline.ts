// The guided tour: chapter definitions, per-chapter condition curves and camera
// keyframes. Everything is a pure function of time so the interactive player,
// the unit tests and the offline video renderer all share one source of truth.

import { clamp, easeInOutCubic, lerp, smoothstep } from './math-utils.ts';

export type ChapterId = 'healthy' | 'ibd' | 'crohns' | 'uc' | 'flares' | 'next';
export interface Chapter { id: ChapterId; title: string; duration: number }
export type Vec3 = [number, number, number];
export interface CameraKeyframe { time: number; position: Vec3; target: Vec3; fov: number }
export interface CameraState { position: Vec3; target: Vec3; fov: number }
export type InsetMode = 'none' | 'crohns' | 'uc';
interface CurveValues { crohns: number; uc: number; ucExtent: number; flare: number; immune: number; remission: number }
export interface SceneState extends CurveValues {
  time: number;
  chapterIndex: number;
  chapterId: ChapterId;
  localT: number;
  insetMode: InsetMode;
  labelsVisible: number;
  camera: CameraState;
}

export const CHAPTERS: readonly Chapter[] = Object.freeze([
  { id: 'healthy', title: 'A healthy gut', duration: 11 },
  { id: 'ibd', title: 'What is IBD?', duration: 9 },
  { id: 'crohns', title: "Crohn's disease", duration: 15 },
  { id: 'uc', title: 'Ulcerative colitis', duration: 15 },
  { id: 'flares', title: 'Flares & remission', duration: 11 },
  { id: 'next', title: 'Next steps', duration: 9 },
]);

export const TOTAL_DURATION = CHAPTERS.reduce((acc, c) => acc + c.duration, 0);

const STARTS = CHAPTERS.reduce<number[]>((acc, _c, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + CHAPTERS[i - 1].duration);
  return acc;
}, []);

export function chapterStart(index: number): number {
  return STARTS[clamp(index, 0, CHAPTERS.length - 1)];
}

export function chapterAt(time: number): { index: number; chapter: Chapter; localTime: number; localT: number } {
  const t = clamp(time, 0, TOTAL_DURATION - 1e-6);
  let index = 0;
  for (let i = 0; i < CHAPTERS.length; i++) {
    if (t >= STARTS[i]) index = i;
  }
  const chapter = CHAPTERS[index];
  const localTime = t - STARTS[index];
  return { index, chapter, localTime, localT: localTime / chapter.duration };
}

export function timeForChapter(idOrIndex: ChapterId | string | number): number {
  const index = typeof idOrIndex === 'number'
    ? idOrIndex
    : CHAPTERS.findIndex((c) => c.id === idOrIndex);
  return chapterStart(index < 0 ? 0 : index);
}

// ---------------------------------------------------------------------------
// Camera keyframes. Times are absolute seconds; the rig eases between them.
// Positions frame the anatomy defined in anatomy-paths.js (front view).
// ---------------------------------------------------------------------------
const K = (time: number, position: Vec3, target: Vec3, fov = 30): CameraKeyframe => ({ time, position, target, fov });
const S = (id: ChapterId, offset: number): number => timeForChapter(id) + offset;
const END = (id: ChapterId): number => timeForChapter(id) + (CHAPTERS.find((c) => c.id === id)?.duration ?? 0);

export const CAMERA_KEYFRAMES: readonly CameraKeyframe[] = Object.freeze([
  K(0, [6.0, 2.4, 27.5], [-0.6, 0.1, 0.3], 33),
  K(END('healthy'), [-4.0, 0.8, 27.0], [-0.6, 0.0, 0.3], 33),
  K(END('ibd'), [-1.6, -1.4, 16.0], [-1.4, -1.0, 0.5], 32),
  K(S('crohns', 3.5), [-5.8, -5.6, 8.6], [-4.3, -3.3, 0.4], 31),
  K(S('crohns', 9.5), [-1.8, -4.4, 12.5], [-2.8, -2.6, 0.5], 31),
  K(END('crohns'), [1.6, 0.2, 19.5], [-1.8, -0.7, 0.4], 32),
  K(S('uc', 3.5), [3.2, -7.2, 9.0], [0.0, -5.2, 0.3], 31),
  K(S('uc', 9.5), [6.4, -1.6, 12.5], [2.2, -0.9, 0.3], 31),
  K(END('uc'), [1.2, 1.0, 22.0], [-1.2, -0.8, 0.3], 32),
  K(S('flares', 5.0), [5.0, -2.6, 14.5], [1.6, -1.6, 0.3], 31),
  K(END('flares'), [-3.2, 0.0, 23.5], [-1.0, -0.5, 0.3], 32),
  K(END('next'), [4.2, 2.2, 27.5], [-0.6, 0.0, 0.3], 33),
]);

function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function cameraAt(time: number): CameraKeyframe {
  const keys = CAMERA_KEYFRAMES;
  if (time <= keys[0].time) return { ...keys[0] };
  const last = keys[keys.length - 1];
  if (time >= last.time) return { ...last };
  let i = 0;
  while (i < keys.length - 2 && time >= keys[i + 1].time) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const t = easeInOutCubic((time - a.time) / (b.time - a.time));
  return {
    time,
    position: lerpVec(a.position, b.position, t),
    target: lerpVec(a.target, b.target, t),
    fov: lerp(a.fov, b.fov, t),
  };
}

// ---------------------------------------------------------------------------
// Condition curves per chapter. Each returns values in [0, 1] and is written so
// that neighbouring chapters meet without jumps.
// ---------------------------------------------------------------------------
const CURVES: Record<ChapterId, (t: number) => CurveValues> = {
  healthy: () => ({ crohns: 0, uc: 0, ucExtent: 0, flare: 0, immune: 0, remission: 0 }),
  ibd: (t) => ({
    crohns: 0, uc: 0, ucExtent: 0, flare: 0, remission: 0,
    immune: smoothstep(0.1, 0.55, t),
  }),
  crohns: (t) => ({
    crohns: smoothstep(0.08, 0.68, t),
    uc: 0, ucExtent: 0, flare: 0, remission: 0,
    immune: 1 - 0.3 * smoothstep(0, 0.25, t),
  }),
  uc: (t) => ({
    crohns: 1 - smoothstep(0, 0.18, t),
    uc: smoothstep(0.05, 0.2, t),
    ucExtent: smoothstep(0.12, 0.82, t),
    flare: 0, remission: 0,
    immune: 0.7,
  }),
  flares: (t) => {
    const flare = smoothstep(0.1, 0.32, t) * (1 - smoothstep(0.52, 0.72, t));
    const remission = smoothstep(0.55, 0.9, t);
    return {
      crohns: 0,
      uc: 1 - 0.92 * remission,
      ucExtent: 1,
      flare,
      remission,
      immune: 0.7 + 0.3 * flare - 0.7 * remission,
    };
  },
  next: (t) => ({
    crohns: 0,
    uc: 0.08 * (1 - smoothstep(0, 0.2, t)),
    ucExtent: 1,
    flare: 0,
    remission: 1,
    immune: 0,
  }),
};

function insetModeFor(chapterId: ChapterId, localT: number): InsetMode {
  if (chapterId === 'crohns') return localT > 0.15 ? 'crohns' : 'none';
  if (chapterId === 'uc') return localT > 0.15 ? 'uc' : 'none';
  if (chapterId === 'flares') return 'uc';
  return 'none';
}

/** Full scene state at absolute time `time` (seconds). */
export function stateAt(time: number): SceneState {
  const { index, chapter, localT } = chapterAt(time);
  const curve = CURVES[chapter.id](localT);
  const camera = cameraAt(clamp(time, 0, TOTAL_DURATION));
  return {
    time,
    chapterIndex: index,
    chapterId: chapter.id,
    localT,
    crohns: clamp(curve.crohns, 0, 1),
    uc: clamp(curve.uc, 0, 1),
    ucExtent: clamp(curve.ucExtent, 0, 1),
    flare: clamp(curve.flare, 0, 1),
    immune: clamp(curve.immune, 0, 1),
    remission: clamp(curve.remission, 0, 1),
    insetMode: insetModeFor(chapter.id, localT),
    labelsVisible: smoothstep(0.06, 0.16, localT) * (1 - smoothstep(0.93, 0.99, localT)),
    camera: { position: camera.position, target: camera.target, fov: camera.fov },
  };
}
