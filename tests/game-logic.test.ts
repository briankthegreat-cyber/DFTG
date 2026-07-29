import assert from "node:assert/strict";
import test from "node:test";
import {
  LEVELS,
  calculateAbsorbScore,
  circlesOverlap,
  classifySize,
  comboAfterEat,
  consumeShield,
  distanceToBoundary,
  isSpawnSafe,
  levelForScore,
  levelProgressForScore,
  resolveControlKey,
  stepMomentum,
  tickPowerup,
  tierForMass,
  ufoReward,
} from "../lib/game-logic.ts";

test("size classification honors edible, neutral, and lethal bands", () => {
  assert.equal(classifySize(100, 92), "edible");
  assert.equal(classifySize(100, 97), "neutral");
  assert.equal(classifySize(100, 103), "lethal");
});

test("all evolution threshold transitions are exact", () => {
  assert.equal(tierForMass(0), 0);
  assert.equal(tierForMass(49), 0);
  assert.equal(tierForMass(50), 1);
  assert.equal(tierForMass(139), 1);
  assert.equal(tierForMass(140), 2);
  assert.equal(tierForMass(600), 4);
  assert.equal(tierForMass(1050), 5);
  assert.equal(tierForMass(1700), 6);
  assert.equal(tierForMass(2600), 7);
});

test("combo grows, caps at five, and resets after its window", () => {
  const continued = comboAfterEat(11, 1.2, 0.3);
  assert.equal(continued.count, 12);
  assert.equal(continued.multiplier, 3);
  const capped = comboAfterEat(40, 1, 0.2);
  assert.equal(capped.multiplier, 5);
  const reset = comboAfterEat(8, 0.2, 0.3);
  assert.equal(reset.count, 1);
  assert.equal(reset.multiplier, 1);
});

test("power-ups expire cleanly", () => {
  const active = tickPowerup("Hyperdrive", 1.4, 0.4);
  assert.equal(active.name, "Hyperdrive");
  assert.ok(Math.abs(active.remaining - 1) < 1e-9);
  assert.deepEqual(tickPowerup("Hyperdrive", 0.2, 0.3), { name: null, remaining: 0 });
});

test("a shield blocks exactly one lethal collision", () => {
  const first = consumeShield(true);
  assert.deepEqual(first, { blocked: true, hasShield: false });
  assert.deepEqual(consumeShield(first.hasShield), { blocked: false, hasShield: false });
});

test("riskier near-limit prey scores more", () => {
  assert.ok(calculateAbsorbScore(90, 100, 2) > calculateAbsorbScore(45, 100, 2));
  assert.ok(calculateAbsorbScore(70, 100, 4) > calculateAbsorbScore(70, 100, 1));
});

test("dangerous spawns reject overlap and the immediate flight path", () => {
  const player = { x: 0, y: 0, radius: 20, vx: 300, vy: 0 };
  assert.equal(isSpawnSafe(player, { x: 30, y: 0, radius: 40 }, true), false);
  assert.equal(isSpawnSafe(player, { x: 600, y: 0, radius: 40 }, true), false);
  assert.equal(isSpawnSafe(player, { x: 0, y: 700, radius: 40 }, true), true);
});

test("fixed-step momentum is stable and reversal takes time", () => {
  let velocity = { x: 0, y: 0 };
  for (let i = 0; i < 120; i += 1) velocity = stepMomentum(velocity, { x: 1, y: 0 }, 1 / 120);
  assert.ok(velocity.x > 250 && velocity.x <= 300);

  let reversalTime = 0;
  while (velocity.x > 0 && reversalTime < 1) {
    velocity = stepMomentum(velocity, { x: -1, y: 0 }, 1 / 120);
    reversalTime += 1 / 120;
  }
  assert.ok(reversalTime >= 0.3 && reversalTime <= 0.5, `reversed after ${reversalTime.toFixed(3)}s`);

  const sixtyHz = stepMomentum({ x: 120, y: -30 }, { x: 1, y: 0 }, 1 / 60);
  let oneTwentyHz = { x: 120, y: -30 };
  oneTwentyHz = stepMomentum(oneTwentyHz, { x: 1, y: 0 }, 1 / 120);
  oneTwentyHz = stepMomentum(oneTwentyHz, { x: 1, y: 0 }, 1 / 120);
  assert.ok(Math.abs(sixtyHz.x - oneTwentyHz.x) < 0.25);
  assert.ok(Math.abs(sixtyHz.y - oneTwentyHz.y) < 0.1);
});

test("WASD, arrow keys, and space resolve to game controls", () => {
  assert.equal(resolveControlKey("KeyW", "w"), "up");
  assert.equal(resolveControlKey("", "W"), "up");
  assert.equal(resolveControlKey("ArrowLeft", "ArrowLeft"), "left");
  assert.equal(resolveControlKey("", "ArrowDown"), "down");
  assert.equal(resolveControlKey("Space", " "), "fire");
  assert.equal(resolveControlKey("KeyQ", "q"), null);
});

test("UFO projectiles use circular collision and tier-scaled rewards", () => {
  assert.equal(circlesOverlap({ x: 0, y: 0, radius: 4 }, { x: 10, y: 0, radius: 6 }), true);
  assert.equal(circlesOverlap({ x: 0, y: 0, radius: 4 }, { x: 11, y: 0, radius: 6 }), false);
  assert.equal(ufoReward(0), 1100);
  assert.equal(ufoReward(7), 2850);
});

test("score advances through named levels with bounded progress", () => {
  assert.equal(levelForScore(0), 0);
  assert.equal(levelForScore(LEVELS[1].minScore - 1), 0);
  assert.equal(levelForScore(LEVELS[1].minScore), 1);
  assert.equal(levelForScore(LEVELS[4].minScore + 5000), 4);
  assert.equal(levelProgressForScore(0), 0);
  assert.equal(levelProgressForScore(LEVELS[1].minScore), 0);
  assert.equal(levelProgressForScore(LEVELS[4].minScore + 5000), 1);
});

test("arena boundary distance reaches zero at and beyond the wall", () => {
  assert.equal(distanceToBoundary(2100, 1600, 4200, 3200), 1600);
  assert.equal(distanceToBoundary(120, 900, 4200, 3200), 120);
  assert.equal(distanceToBoundary(-10, 900, 4200, 3200), 0);
});
