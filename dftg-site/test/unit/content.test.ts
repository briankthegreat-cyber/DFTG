import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_CONTENT, DISCLAIMER, ALL_LABELS, REVIEW, SOURCES } from '../../src/ibd/content.ts';
import { CHAPTERS } from '../../src/ibd/timeline.ts';
import { SEGMENTS } from '../../src/ibd/anatomy-paths.ts';

test('every chapter has patient-friendly content', () => {
  for (const chapter of CHAPTERS) {
    const c = CHAPTER_CONTENT[chapter.id];
    assert.ok(c, `missing content for ${chapter.id}`);
    assert.ok(c.title.length > 3 && c.title.length < 60);
    assert.ok(c.body.length > 40 && c.body.length < 520, `${chapter.id} body length ${c.body.length}`);
    assert.ok(Array.isArray(c.facts) && c.facts.length >= 2 && c.facts.length <= 4);
  }
});

test('labels anchor to valid anatomy', () => {
  assert.ok(ALL_LABELS.length >= 6);
  for (const label of ALL_LABELS) {
    assert.ok(SEGMENTS[label.tube], `unknown tube ${label.tube}`);
    assert.ok(label.u >= 0 && label.u <= 1);
    assert.ok(label.text.length > 2 && label.text.length < 60);
    assert.ok(label.appear >= 0 && label.appear < 1);
  }
});

test('the disclaimer says this is education, not diagnosis, and covers emergencies', () => {
  assert.match(DISCLAIMER, /education/i);
  assert.match(DISCLAIMER, /not medical advice/i);
  assert.match(DISCLAIMER, /911/);
  assert.ok(REVIEW.reviewedBy.length > 0 && REVIEW.lastReviewed.length > 0);
  for (const s of SOURCES) assert.match(s.url, /^https:\/\//);
});
