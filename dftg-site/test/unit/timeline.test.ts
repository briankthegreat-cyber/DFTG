import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, TOTAL_DURATION, chapterAt, chapterStart, stateAt, timeForChapter } from '../../src/ibd/timeline.ts';

test('chapters cover the full tour in the expected order', () => {
  assert.deepEqual(CHAPTERS.map((c) => c.id), ['healthy', 'ibd', 'crohns', 'uc', 'flares', 'next']);
  const sum = CHAPTERS.reduce((acc, c) => acc + c.duration, 0);
  assert.ok(Math.abs(sum - TOTAL_DURATION) < 1e-9);
  assert.equal(chapterStart(0), 0);
  assert.ok(Math.abs(chapterStart(2) - (CHAPTERS[0].duration + CHAPTERS[1].duration)) < 1e-9);
});

test('chapterAt resolves boundaries and clamps out-of-range times', () => {
  assert.equal(chapterAt(0).index, 0);
  assert.equal(chapterAt(chapterStart(1)).index, 1);
  assert.equal(chapterAt(-5).index, 0);
  assert.equal(chapterAt(TOTAL_DURATION + 5).index, CHAPTERS.length - 1);
  const mid = chapterAt(chapterStart(2) + CHAPTERS[2].duration / 2);
  assert.ok(Math.abs(mid.localT - 0.5) < 1e-9);
});

test('timeForChapter accepts ids and indices', () => {
  assert.equal(timeForChapter('crohns'), chapterStart(2));
  assert.equal(timeForChapter(3), chapterStart(3));
});

test('the healthy chapter has no inflammation', () => {
  const s = stateAt(2);
  assert.equal(s.chapterId, 'healthy');
  assert.equal(s.crohns, 0);
  assert.equal(s.uc, 0);
  assert.equal(s.ucExtent, 0);
});

test("Crohn's builds up mid-chapter and fades out as ulcerative colitis takes over", () => {
  const crohnsMid = stateAt(chapterStart(2) + CHAPTERS[2].duration * 0.7);
  assert.ok(crohnsMid.crohns > 0.95);
  assert.equal(crohnsMid.uc, 0);

  const ucEarly = stateAt(chapterStart(3) + CHAPTERS[3].duration * 0.05);
  assert.ok(ucEarly.crohns < crohnsMid.crohns);

  const ucLate = stateAt(chapterStart(3) + CHAPTERS[3].duration * 0.9);
  assert.equal(ucLate.crohns, 0);
  assert.ok(ucLate.uc > 0.9);
  assert.ok(ucLate.ucExtent > 0.9, 'extends to pancolitis by the end of the chapter');
});

test('flares chapter pulses then settles into remission, and the tour ends calm', () => {
  const flare = stateAt(chapterStart(4) + CHAPTERS[4].duration * 0.35);
  assert.ok(flare.flare > 0.5);
  const remission = stateAt(chapterStart(4) + CHAPTERS[4].duration * 0.98);
  assert.ok(remission.flare < 0.05);
  assert.ok(remission.uc < flare.uc);
  const end = stateAt(TOTAL_DURATION - 0.01);
  assert.equal(end.chapterId, 'next');
  assert.ok(end.uc < 0.01 && end.crohns < 0.01);
});

test('state is continuous: no jumps in inflammation or camera between samples', () => {
  let prev = stateAt(0);
  for (let t = 0.05; t <= TOTAL_DURATION; t += 0.05) {
    const s = stateAt(t);
    for (const key of ['crohns', 'uc', 'ucExtent', 'flare', 'immune'] as const) {
      assert.ok(Math.abs(s[key] - prev[key]) < 0.06, `${key} jumped at t=${t.toFixed(2)}`);
      assert.ok(s[key] >= 0 && s[key] <= 1, `${key} out of range at t=${t}`);
    }
    const dp = Math.hypot(...s.camera.position.map((v, i) => v - prev.camera.position[i]));
    const dt = Math.hypot(...s.camera.target.map((v, i) => v - prev.camera.target[i]));
    assert.ok(dp < 0.6, `camera position jumped ${dp.toFixed(2)} at t=${t.toFixed(2)}`);
    assert.ok(dt < 0.6, `camera target jumped ${dt.toFixed(2)} at t=${t.toFixed(2)}`);
    assert.ok(Number.isFinite(s.camera.fov));
    prev = s;
  }
});

test('inset cross-section mode follows the active condition', () => {
  assert.equal(stateAt(1).insetMode, 'none');
  assert.equal(stateAt(chapterStart(2) + 8).insetMode, 'crohns');
  assert.equal(stateAt(chapterStart(3) + 8).insetMode, 'uc');
});
