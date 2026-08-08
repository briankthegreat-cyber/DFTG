import { describe, expect, it } from 'vitest';
import { buildAnatomyIndex } from './ontology';
import { AnatomySearch, buildSearchDocs } from './search';
import { makeBinding, makeManifest, makeStructure } from './testing';

function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected value to be defined');
  return value;
}

const index = buildAnatomyIndex({
  structures: [
    makeStructure({
      structure_id: 'TEST-S-TRUNK',
      canonical_name: 'Trunk Column',
      system: 'skeletal',
    }),
    makeStructure({
      structure_id: 'TEST-S-TRUNK-EXT',
      canonical_name: 'Trunk Column Extended',
      system: 'skeletal',
    }),
    makeStructure({
      structure_id: 'TEST-S-ROD',
      canonical_name: 'Spinal Rod',
      synonyms: ['Trunk Column (archaic)'],
      system: 'skeletal',
    }),
    makeStructure({
      structure_id: 'TEST-S-FUZZ',
      canonical_name: 'Trynk Colomn',
      system: 'skeletal',
    }),
    makeStructure({
      structure_id: 'TEST-S-VESSEL',
      canonical_name: 'Trunk Vessel',
      system: 'cardiovascular',
    }),
    makeStructure({
      structure_id: 'TEST-S-BACK',
      canonical_name: 'Vertebral Column',
      synonyms: ['Backbone', 'Spine'],
      system: 'skeletal',
    }),
  ],
  manifests: [
    makeManifest({
      bindings: [
        makeBinding({
          geometry_id: 'TEST-G-TRUNK',
          structure_id: 'TEST-S-TRUNK',
          canonical_name: 'Trunk Column',
          system: 'skeletal',
        }),
      ],
    }),
  ],
});

const search = new AnatomySearch(buildSearchDocs(index));

describe('AnatomySearch', () => {
  it('ranks exact canonical_name above prefix, synonym, and fuzzy matches', () => {
    const results = search.search('trunk column');
    const byId = new Map(results.map((r) => [r.structure_id, r]));
    const exact = must(byId.get('TEST-S-TRUNK'));
    const prefix = must(byId.get('TEST-S-TRUNK-EXT'));
    const synonym = must(byId.get('TEST-S-ROD'));
    const fuzzy = must(byId.get('TEST-S-FUZZ'));

    expect(must(results[0]).structure_id).toBe('TEST-S-TRUNK');
    expect(exact.matched_field).toBe('canonical_name');
    expect(prefix.matched_field).toBe('canonical_name');
    expect(synonym.matched_field).toBe('synonym');
    expect(fuzzy.matched_field).toBe('fuzzy');
    expect(exact.score).toBeGreaterThan(prefix.score);
    expect(prefix.score).toBeGreaterThan(synonym.score);
    expect(synonym.score).toBeGreaterThan(fuzzy.score);
  });

  it('reports synonym hits with matched_field synonym and the matching synonym text', () => {
    const results = search.search('backbone');
    const top = must(results[0]);
    expect(top.structure_id).toBe('TEST-S-BACK');
    expect(top.matched_field).toBe('synonym');
    expect(top.matched_text).toBe('Backbone');
  });

  it('finds the target for a fuzzy typo, scored below every exact tier', () => {
    const results = search.search('trnk colum');
    const hit = must(results.find((r) => r.structure_id === 'TEST-S-TRUNK'));
    expect(hit.matched_field).toBe('fuzzy');
    // 60 is the lowest non-fuzzy tier (substring containment).
    expect(hit.score).toBeLessThan(60);
  });

  it('applies the system filter', () => {
    const results = search.search('trunk', { system: 'cardiovascular' });
    expect(results.map((r) => r.structure_id)).toEqual(['TEST-S-VESSEL']);
    for (const result of results) expect(result.doc.system).toBe('cardiovascular');
  });

  it('excludes geometry-less structures when requireGeometry is true', () => {
    const ids = search.search('trunk column', { requireGeometry: true }).map((r) => r.structure_id);
    expect(ids).toContain('TEST-S-TRUNK');
    expect(ids).not.toContain('TEST-S-TRUNK-EXT');
  });

  it('includes geometry-less structures when requireGeometry is false, flagged has_geometry false', () => {
    const results = search.search('trunk column', { requireGeometry: false });
    const withGeometry = must(results.find((r) => r.structure_id === 'TEST-S-TRUNK'));
    const withoutGeometry = must(results.find((r) => r.structure_id === 'TEST-S-TRUNK-EXT'));
    expect(withGeometry.doc.has_geometry).toBe(true);
    expect(withoutGeometry.doc.has_geometry).toBe(false);
  });

  it('returns [] for an empty or whitespace-only query', () => {
    expect(search.search('')).toEqual([]);
    expect(search.search('   ')).toEqual([]);
  });
});
