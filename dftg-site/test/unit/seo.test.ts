import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guides, nav, related, seo } from '../../src/site/data.ts';

const routes = new Set(['/', '/learn', '/learn/ibd', '/learn/ibs', '/community', '/get-involved', '/shop']);

test('every page has a unique title and description of sensible length', () => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const [key, page] of Object.entries(seo)) {
    assert.ok(page.title.length >= 10 && page.title.length <= 70, `${key} title length ${page.title.length}`);
    assert.ok(page.description.length >= 50 && page.description.length <= 165, `${key} description length ${page.description.length}`);
    assert.ok(!titles.has(page.title), `${key} duplicate title`);
    assert.ok(!descriptions.has(page.description), `${key} duplicate description`);
    titles.add(page.title);
    descriptions.add(page.description);
    assert.match(page.image, /^og\/[a-z-]+\.jpg$/);
  }
});

test('related links and navigation point at real routes', () => {
  for (const item of nav) assert.ok(routes.has(item.to), `nav ${item.to}`);
  for (const [page, links] of Object.entries(related)) {
    assert.ok(links.length >= 3, `${page} needs at least three related links`);
    for (const l of links) {
      const path = l.to.split('#')[0];
      assert.ok(routes.has(path), `${page} related link ${l.to}`);
      const hash = l.to.split('#')[1];
      if (hash?.startsWith('guide-')) assert.ok(guides.some((g) => `guide-${g.slug}` === hash), `${page} guide anchor ${hash}`);
    }
  }
});

test('every guide cites at least one https source', () => {
  for (const g of guides) {
    assert.ok(g.sources.length >= 1, `${g.slug} sources`);
    for (const s of g.sources) assert.match(s.url, /^https:\/\//);
  }
});
