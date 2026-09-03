import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEGMENTS, createCurves, LANDMARKS, radiusProfile, findU } from '../../src/ibd/anatomy-paths.ts';
import type { TubeKey } from '../../src/ibd/conditions.ts';

const TUBES = Object.keys(SEGMENTS) as TubeKey[];

const finiteVec = (p: number[]) => p.length === 3 && p.every(Number.isFinite);

test('every segment has finite control points', () => {
  for (const [key, seg] of Object.entries(SEGMENTS)) {
    assert.ok(seg.points.length >= 4, `${key} needs at least 4 points`);
    for (const p of seg.points) assert.ok(finiteVec(p), `${key} has a bad point`);
  }
});

test('anatomy follows anterior-view conventions (patient left = viewer right)', () => {
  const stomach = SEGMENTS.stomach.points;
  const fundus = stomach.reduce((a, b) => (b[1] > a[1] ? b : a));
  assert.ok(fundus[0] > 0, 'stomach fundus sits on the patient\'s left (viewer\'s right)');

  const colon = SEGMENTS.colon.points;
  const cecum = colon[0];
  assert.ok(cecum[0] < 0 && cecum[1] < 0, 'cecum sits in the patient\'s lower right (viewer\'s lower left)');
  const rectum = colon[colon.length - 1];
  assert.ok(Math.abs(rectum[0]) < 0.6, 'rectum is midline');
  assert.ok(rectum[1] < cecum[1], 'rectum is the lowest point of the colon');

  const hepatic = colon.filter((p) => p[0] < -2.5).reduce((a, b) => (b[1] > a[1] ? b : a));
  const splenic = colon.filter((p) => p[0] > 2.5).reduce((a, b) => (b[1] > a[1] ? b : a));
  assert.ok(splenic[1] > hepatic[1], 'splenic flexure is higher than hepatic flexure');
});

test('small intestine ends at the ileocecal junction', () => {
  const si = SEGMENTS.smallIntestine.points;
  const end = si[si.length - 1];
  const cecum = SEGMENTS.colon.points[0];
  const d = Math.hypot(end[0] - cecum[0], end[1] - cecum[1], end[2] - cecum[2]);
  assert.ok(d < 1.2, `terminal ileum is ${d.toFixed(2)} units from the cecum`);
  const start = si[0];
  const pylorus = SEGMENTS.stomach.points[SEGMENTS.stomach.points.length - 1];
  const d2 = Math.hypot(start[0] - pylorus[0], start[1] - pylorus[1], start[2] - pylorus[2]);
  assert.ok(d2 < 0.8, `duodenum starts ${d2.toFixed(2)} units from the pylorus`);
});

test('curves are valid and landmarks are ordered along the colon', () => {
  const curves = createCurves();
  for (const key of TUBES) {
    const len = curves[key].getLength();
    assert.ok(len > 1, `${key} length ${len}`);
    const p = curves[key].getPointAt(0.5);
    assert.ok([p.x, p.y, p.z].every(Number.isFinite));
  }
  const colonLen = curves.colon.getLength();
  const siLen = curves.smallIntestine.getLength();
  assert.ok(siLen > colonLen, 'small intestine is longer than the colon');

  const u = (name: string) => findU(curves.colon, LANDMARKS[name].point);
  assert.ok(u('cecum') < u('hepaticFlexure'));
  assert.ok(u('hepaticFlexure') < u('splenicFlexure'));
  assert.ok(u('splenicFlexure') < u('sigmoid'));
  assert.ok(u('sigmoid') < u('rectum'));
  assert.ok(u('rectum') > 0.9);
});

test('radius profiles are positive and the colon is wider than the small intestine', () => {
  for (const key of TUBES) {
    for (let u = 0; u <= 1; u += 0.05) {
      assert.ok(radiusProfile(key, u) > 0, `${key} radius at ${u}`);
    }
  }
  assert.ok(radiusProfile('colon', 0.5) > radiusProfile('smallIntestine', 0.5));
  assert.ok(radiusProfile('stomach', 0.2) > radiusProfile('colon', 0.5), 'stomach fundus is the widest');
});
