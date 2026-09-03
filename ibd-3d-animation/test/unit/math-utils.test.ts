import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp, lerp, inverseLerp, remap, smoothstep, easeInOutCubic, easeOutCubic,
  gaussian, mulberry32,
} from '../../src/ibd/math-utils.ts';

test('clamp keeps values inside the range', () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-2, 0, 1), 0);
  assert.equal(clamp(0.4, 0, 1), 0.4);
});

test('lerp and inverseLerp are inverses', () => {
  assert.equal(lerp(10, 20, 0.25), 12.5);
  assert.equal(inverseLerp(10, 20, 12.5), 0.25);
});

test('remap clamps to the output range', () => {
  assert.equal(remap(5, 0, 10, 0, 1), 0.5);
  assert.equal(remap(-5, 0, 10, 0, 1), 0);
  assert.equal(remap(50, 0, 10, 0, 1), 1);
});

test('smoothstep is 0 below, 1 above, and monotonic between edges', () => {
  assert.equal(smoothstep(0.2, 0.8, 0), 0);
  assert.equal(smoothstep(0.2, 0.8, 1), 1);
  let prev = -1;
  for (let x = 0; x <= 1.0001; x += 0.05) {
    const v = smoothstep(0.2, 0.8, x);
    assert.ok(v >= prev, `not monotonic at ${x}`);
    prev = v;
  }
});

test('easings hit their endpoints and stay within [0,1]', () => {
  for (const fn of [easeInOutCubic, easeOutCubic]) {
    assert.equal(fn(0), 0);
    assert.equal(fn(1), 1);
    for (let t = 0; t <= 1; t += 0.1) {
      const v = fn(t);
      assert.ok(v >= -1e-9 && v <= 1 + 1e-9);
    }
  }
});

test('gaussian peaks at the center and decays with distance', () => {
  assert.ok(Math.abs(gaussian(0.5, 0.5, 0.1) - 1) < 1e-9);
  assert.ok(gaussian(0.7, 0.5, 0.1) < 0.2);
});

test('mulberry32 is deterministic for a seed and produces values in [0,1)', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 20; i++) {
    const va = a();
    assert.equal(va, b());
    assert.ok(va >= 0 && va < 1);
  }
});
