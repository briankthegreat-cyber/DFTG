// Small, dependency-free math helpers shared by the timeline, condition model,
// and rendering code. Everything here is pure so it can be unit tested in Node.

export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const inverseLerp = (a: number, b: number, v: number): number => (a === b ? 0 : (v - a) / (b - a));

/** Linear remap with the output clamped to [outMin, outMax]. */
export function remap(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const t = clamp(inverseLerp(inMin, inMax, v), 0, 1);
  return lerp(outMin, outMax, t);
}

/** GLSL-compatible smoothstep. Edges may be given in either order. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;

/** Unnormalised gaussian bump: 1 at `center`, ~0.6 at one `width` away. */
export function gaussian(x: number, center: number, width: number): number {
  const d = (x - center) / width;
  return Math.exp(-d * d);
}

/** Deterministic 32-bit PRNG (mulberry32). Returns a function yielding [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Critically damped spring step; returns the new [value, velocity]. */
export function springStep(value: number, velocity: number, target: number, stiffness: number, dt: number): [number, number] {
  const damping = 2 * Math.sqrt(stiffness);
  const accel = -stiffness * (value - target) - damping * velocity;
  const nextVelocity = velocity + accel * dt;
  const nextValue = value + nextVelocity * dt;
  return [nextValue, nextVelocity];
}
