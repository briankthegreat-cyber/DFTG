export type CollisionClass = "edible" | "neutral" | "lethal";

export const EDIBLE_RATIO = 0.92;
export const LETHAL_RATIO = 1.03;

export const TIERS = [
  { name: "Cosmic Spark", min: 0, next: 50, radius: 12, phase: "Primordial Dust", accent: "#78f6ff" },
  { name: "Meteor Seed", min: 50, next: 140, radius: 17, phase: "Primordial Dust", accent: "#9ee8ff" },
  { name: "Asteroid", min: 140, next: 300, radius: 23, phase: "Asteroid Belt", accent: "#d7b28b" },
  { name: "Planetoid", min: 300, next: 600, radius: 30, phase: "Lunar Field", accent: "#f0cf9a" },
  { name: "Moon", min: 600, next: 1050, radius: 38, phase: "Lunar Field", accent: "#e7efff" },
  { name: "Planet", min: 1050, next: 1700, radius: 47, phase: "Planetary System", accent: "#68ddc6" },
  { name: "Star", min: 1700, next: 2600, radius: 57, phase: "Stellar Nursery", accent: "#ffd67a" },
  { name: "Singularity", min: 2600, next: Number.POSITIVE_INFINITY, radius: 66, phase: "Collapsing Space", accent: "#f5a7ff" },
] as const;

export const LEVELS = [
  { name: "Dust Verge", minScore: 0, accent: "#78f6ff" },
  { name: "Meteor Belt", minScore: 1800, accent: "#f2ce7f" },
  { name: "Lunar Rift", minScore: 5000, accent: "#b392ff" },
  { name: "Stellar Siege", minScore: 9500, accent: "#ff719d" },
  { name: "Event Horizon", minScore: 15500, accent: "#f5a7ff" },
] as const;

export const POWER_DURATIONS: Record<string, number> = {
  "Gravity Feast": 8,
  "Phase Shift": 5,
  "Solar Pulse": 0.9,
  Hyperdrive: 6,
  "Time Fold": 5,
  "Event Horizon Shield": 25,
};

export type ControlAction = "left" | "right" | "up" | "down" | "fire" | null;

export function resolveControlKey(code: string, key: string): ControlAction {
  const normalizedCode = code.toLowerCase();
  const normalizedKey = key.toLowerCase();
  if (normalizedCode === "keya" || normalizedCode === "arrowleft" || normalizedKey === "a" || normalizedKey === "arrowleft") return "left";
  if (normalizedCode === "keyd" || normalizedCode === "arrowright" || normalizedKey === "d" || normalizedKey === "arrowright") return "right";
  if (normalizedCode === "keyw" || normalizedCode === "arrowup" || normalizedKey === "w" || normalizedKey === "arrowup") return "up";
  if (normalizedCode === "keys" || normalizedCode === "arrowdown" || normalizedKey === "s" || normalizedKey === "arrowdown") return "down";
  if (normalizedCode === "space" || key === " " || normalizedKey === "spacebar" || normalizedKey === "space") return "fire";
  return null;
}

export function circlesOverlap(
  first: { x: number; y: number; radius: number },
  second: { x: number; y: number; radius: number },
): boolean {
  return Math.hypot(first.x - second.x, first.y - second.y) <= first.radius + second.radius;
}

export function ufoReward(tier: number): number {
  return 1100 + Math.max(0, Math.min(7, Math.floor(tier))) * 250;
}

export function levelForScore(score: number): number {
  for (let index = LEVELS.length - 1; index >= 0; index -= 1) {
    if (score >= LEVELS[index].minScore) return index;
  }
  return 0;
}

export function levelProgressForScore(score: number): number {
  const level = levelForScore(score);
  if (level === LEVELS.length - 1) return 1;
  const current = LEVELS[level].minScore;
  const next = LEVELS[level + 1].minScore;
  return Math.max(0, Math.min(1, (score - current) / (next - current)));
}

export function distanceToBoundary(x: number, y: number, width: number, height: number): number {
  return Math.max(0, Math.min(x, y, width - x, height - y));
}

export function classifySize(playerRadius: number, objectRadius: number): CollisionClass {
  const ratio = objectRadius / playerRadius;
  if (ratio <= EDIBLE_RATIO) return "edible";
  if (ratio >= LETHAL_RATIO) return "lethal";
  return "neutral";
}

export function tierForMass(mass: number): number {
  for (let i = TIERS.length - 1; i >= 0; i -= 1) {
    if (mass >= TIERS[i].min) return i;
  }
  return 0;
}

export function comboAfterEat(
  previousCount: number,
  previousTimer: number,
  elapsed: number,
  extension = 0,
): { count: number; multiplier: number; timer: number } {
  const stillAlive = previousCount > 0 && previousTimer + extension - elapsed > 0;
  const count = stillAlive ? previousCount + 1 : 1;
  return {
    count,
    multiplier: Math.min(5, 1 + Math.floor(count / 3) * 0.5),
    timer: 2.2 + extension,
  };
}

export function decayCombo(
  count: number,
  timer: number,
  dt: number,
): { count: number; multiplier: number; timer: number } {
  const nextTimer = Math.max(0, timer - dt);
  if (nextTimer === 0) return { count: 0, multiplier: 1, timer: 0 };
  return {
    count,
    multiplier: Math.min(5, 1 + Math.floor(count / 3) * 0.5),
    timer: nextTimer,
  };
}

export function tickPowerup(
  name: string | null,
  remaining: number,
  dt: number,
): { name: string | null; remaining: number } {
  if (!name) return { name: null, remaining: 0 };
  const next = Math.max(0, remaining - dt);
  return next === 0 ? { name: null, remaining: 0 } : { name, remaining: next };
}

export function consumeShield(hasShield: boolean): { blocked: boolean; hasShield: boolean } {
  return hasShield ? { blocked: true, hasShield: false } : { blocked: false, hasShield: false };
}

export function calculateAbsorbScore(
  objectRadius: number,
  playerRadius: number,
  multiplier = 1,
): number {
  const closeness = Math.min(1, objectRadius / Math.max(1, playerRadius));
  const base = 35 + objectRadius * 4;
  const riskBonus = closeness > 0.75 ? 1 + (closeness - 0.75) * 2.4 : 1;
  return Math.round(base * riskBonus * Math.max(1, multiplier));
}

export function safeSpawnDistance(
  playerRadius: number,
  objectRadius: number,
  dangerous: boolean,
): number {
  const base = playerRadius + objectRadius + 90;
  return dangerous ? base + 260 : base + 80;
}

export function stepMomentum(
  velocity: { x: number; y: number },
  input: { x: number; y: number },
  dt: number,
  acceleration = 520,
  maxSpeed = 300,
  damping = 1.35,
): { x: number; y: number } {
  const magnitude = Math.hypot(input.x, input.y);
  const nx = magnitude > 1 ? input.x / magnitude : input.x;
  const ny = magnitude > 1 ? input.y / magnitude : input.y;
  const speed = Math.hypot(velocity.x, velocity.y);
  const dot = speed > 0 && magnitude > 0 ? (velocity.x * nx + velocity.y * ny) / speed : 0;
  const thrustScale = dot < -0.15 ? 0.85 : 1;
  const decay = Math.exp(-damping * dt);
  let x = velocity.x * decay + nx * acceleration * thrustScale * dt;
  let y = velocity.y * decay + ny * acceleration * thrustScale * dt;

  if (speed > 30 && magnitude > 0 && Math.abs(dot) < 0.7) {
    const steer = Math.min(0.2 * dt * 6, 0.16);
    const targetX = nx * Math.hypot(x, y);
    const targetY = ny * Math.hypot(x, y);
    x += (targetX - x) * steer;
    y += (targetY - y) * steer;
  }

  const nextSpeed = Math.hypot(x, y);
  if (nextSpeed > maxSpeed) {
    x = (x / nextSpeed) * maxSpeed;
    y = (y / nextSpeed) * maxSpeed;
  }
  return { x, y };
}

export function isSpawnSafe(
  player: { x: number; y: number; radius: number; vx: number; vy: number },
  candidate: { x: number; y: number; radius: number },
  dangerous: boolean,
): boolean {
  const dx = candidate.x - player.x;
  const dy = candidate.y - player.y;
  const distance = Math.hypot(dx, dy);
  if (distance < safeSpawnDistance(player.radius, candidate.radius, dangerous)) return false;
  if (!dangerous) return true;
  const speed = Math.hypot(player.vx, player.vy);
  if (speed < 20) return true;
  const ahead = (dx * player.vx + dy * player.vy) / (distance * speed);
  return !(ahead > 0.72 && distance < 700);
}
