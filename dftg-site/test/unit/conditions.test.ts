import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_LESIONS, CROHNS_LESIONS, UC_STAGES, lesionMask, ucMask, ucStage,
  inflammation, lesionUniformArray, lesionActivation,
} from '../../src/ibd/conditions.ts';

test("Crohn's lesions are patchy with a dominant terminal ileum lesion and a spared rectum", () => {
  const si = CROHNS_LESIONS.smallIntestine;
  const terminal = si.find((l) => l.center > 0.85);
  assert.ok(terminal, 'terminal ileum lesion exists');
  assert.ok(terminal!.intensity >= 0.9, 'terminal ileum is the most intense lesion');
  // No colon lesion reaches into the rectum (rectal sparing is typical of Crohn's).
  for (const lesion of CROHNS_LESIONS.colon) {
    assert.ok(lesion.center + lesion.halfWidth < 0.88, `colon lesion at ${lesion.center} touches the rectum`);
  }
  assert.ok(CROHNS_LESIONS.smallIntestine.length + CROHNS_LESIONS.colon.length <= MAX_LESIONS);
});

test('lesionActivation grows with progress and respects per-lesion delay', () => {
  const lesion = { center: 0.5, halfWidth: 0.05, intensity: 1, delay: 0.4 };
  assert.equal(lesionActivation(lesion, 0), 0);
  assert.equal(lesionActivation(lesion, 0.4), 0);
  assert.ok(lesionActivation(lesion, 0.6) > 0.3);
  assert.equal(lesionActivation(lesion, 1), 1);
});

test('lesionMask leaves healthy skip areas between lesions', () => {
  const lesions = CROHNS_LESIONS.smallIntestine;
  assert.ok(lesionMask(0.94, lesions, 1) > 0.9, 'terminal ileum fully inflamed at full progress');
  assert.ok(lesionMask(0.80, lesions, 1) < 0.05, 'skip area between lesions stays healthy');
  assert.equal(lesionMask(0.94, lesions, 0), 0, 'nothing inflamed at zero progress');
});

test('ucMask is continuous from the rectum and never affects tissue beyond the front', () => {
  assert.equal(ucMask(0.5, 0), 0);
  assert.ok(ucMask(0.99, 0.12) > 0.95, 'rectum inflamed in proctitis');
  assert.equal(ucMask(0.5, 0.12), 0, 'mid colon spared in proctitis');
  // Monotonic: inflammation never has gaps along the colon.
  let prev = 0;
  for (let u = 0; u <= 1.0001; u += 0.01) {
    const v = ucMask(u, 0.5);
    assert.ok(v + 1e-9 >= prev, `gap at u=${u}`);
    prev = v;
  }
});

test('ucStage reports the furthest named extent reached', () => {
  assert.equal(ucStage(0), null);
  assert.equal(ucStage(0.2)?.id, 'proctitis');
  assert.equal(ucStage(0.6)?.id, 'left-sided');
  assert.equal(ucStage(1)?.id, 'extensive');
  assert.equal(UC_STAGES.length, 3);
});

test('inflammation combines conditions per tube and respects anatomy', () => {
  const crohns = inflammation('smallIntestine', 0.94, { crohns: 1, uc: 0, ucExtent: 0 });
  assert.ok(crohns.crohns > 0.9);
  assert.equal(crohns.uc, 0);

  const rectumCrohns = inflammation('colon', 0.97, { crohns: 1, uc: 0, ucExtent: 0 });
  assert.ok(rectumCrohns.total < 0.05, 'rectum spared in Crohn\'s');

  const rectumUc = inflammation('colon', 0.99, { crohns: 0, uc: 1, ucExtent: 0.12 });
  assert.ok(rectumUc.uc > 0.95);

  const siUc = inflammation('smallIntestine', 0.99, { crohns: 0, uc: 1, ucExtent: 1 });
  assert.equal(siUc.uc, 0, 'ulcerative colitis never involves the small intestine');

  const stomachAnything = inflammation('stomach', 0.5, { crohns: 1, uc: 1, ucExtent: 1 });
  assert.equal(stomachAnything.total, 0);
});

test('lesionUniformArray pads to MAX_LESIONS vec4 entries', () => {
  const arr = lesionUniformArray(CROHNS_LESIONS.smallIntestine);
  assert.equal(arr.length, MAX_LESIONS * 4);
  assert.ok(Math.abs(arr[0] - CROHNS_LESIONS.smallIntestine[0].center) < 1e-6);
  assert.equal(arr[arr.length - 1], 0);
});
