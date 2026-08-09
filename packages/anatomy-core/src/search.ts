import Fuse from 'fuse.js';
import type { AnatomyIndex } from './ontology';
import type { EducationalPriority, Laterality } from './schemas';

/**
 * Local search over canonical names, display names, synonyms, and source IDs.
 * Exact and prefix matches always rank above fuzzy matches, and every result
 * says WHY it matched so the UI can explain synonym hits.
 */

export interface SearchDoc {
  structure_id: string;
  canonical_name: string;
  display_name: string;
  synonyms: string[];
  ta2_id: string | null;
  system: string;
  region: string | null;
  laterality: Laterality;
  educational_priority: EducationalPriority;
  has_geometry: boolean;
  bundle_ids: string[];
}

export interface SearchFilters {
  system?: string;
  region?: string;
  laterality?: Laterality;
  educational_priority?: EducationalPriority;
  requireGeometry?: boolean;
  /** When set, restrict to structures whose geometry lives in one of these bundles. */
  bundleIds?: string[];
}

export type MatchedField = 'canonical_name' | 'display_name' | 'synonym' | 'ta2_id' | 'fuzzy';

export interface SearchResult {
  structure_id: string;
  score: number;
  matched_field: MatchedField;
  matched_text: string;
  doc: SearchDoc;
}

export function buildSearchDocs(index: AnatomyIndex): SearchDoc[] {
  const docs: SearchDoc[] = [];
  for (const structure of index.structuresById.values()) {
    docs.push({
      structure_id: structure.structure_id,
      canonical_name: structure.canonical_name,
      display_name: structure.display_name ?? structure.canonical_name,
      synonyms: structure.synonyms,
      ta2_id: structure.ta2_id ?? null,
      system: structure.system,
      region: structure.region ?? null,
      laterality: structure.laterality,
      educational_priority: structure.educational_priority,
      has_geometry: (index.bindingsByStructureId.get(structure.structure_id)?.length ?? 0) > 0,
      bundle_ids: index.bundleIdsByStructureId.get(structure.structure_id) ?? [],
    });
  }
  return docs;
}

function passesFilters(doc: SearchDoc, filters: SearchFilters | undefined): boolean {
  if (!filters) return true;
  if (filters.system !== undefined && doc.system !== filters.system) return false;
  if (filters.region !== undefined && doc.region !== filters.region) return false;
  if (filters.laterality !== undefined && doc.laterality !== filters.laterality) return false;
  if (
    filters.educational_priority !== undefined &&
    doc.educational_priority !== filters.educational_priority
  )
    return false;
  if (filters.requireGeometry === true && !doc.has_geometry) return false;
  if (
    filters.bundleIds !== undefined &&
    !doc.bundle_ids.some((b) => filters.bundleIds?.includes(b))
  )
    return false;
  return true;
}

export class AnatomySearch {
  private readonly docs: SearchDoc[];
  private readonly fuse: Fuse<SearchDoc>;

  constructor(docs: SearchDoc[]) {
    this.docs = docs;
    this.fuse = new Fuse(docs, {
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      keys: [
        { name: 'canonical_name', weight: 0.4 },
        { name: 'display_name', weight: 0.3 },
        { name: 'synonyms', weight: 0.2 },
        { name: 'ta2_id', weight: 0.1 },
      ],
    });
  }

  search(query: string, filters?: SearchFilters, limit = 20): SearchResult[] {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];

    const results = new Map<string, SearchResult>();
    const push = (result: SearchResult) => {
      const existing = results.get(result.structure_id);
      if (!existing || result.score > existing.score) results.set(result.structure_id, result);
    };

    // Tier 1/2: exact and prefix matches on canonical/display names, synonyms, ta2.
    for (const doc of this.docs) {
      if (!passesFilters(doc, filters)) continue;
      const canonical = doc.canonical_name.toLowerCase();
      const display = doc.display_name.toLowerCase();
      if (canonical === q) {
        push({
          structure_id: doc.structure_id,
          score: 100,
          matched_field: 'canonical_name',
          matched_text: doc.canonical_name,
          doc,
        });
        continue;
      }
      if (display === q) {
        push({
          structure_id: doc.structure_id,
          score: 95,
          matched_field: 'display_name',
          matched_text: doc.display_name,
          doc,
        });
        continue;
      }
      if (canonical.startsWith(q)) {
        push({
          structure_id: doc.structure_id,
          score: 90,
          matched_field: 'canonical_name',
          matched_text: doc.canonical_name,
          doc,
        });
        continue;
      }
      if (display.startsWith(q)) {
        push({
          structure_id: doc.structure_id,
          score: 85,
          matched_field: 'display_name',
          matched_text: doc.display_name,
          doc,
        });
        continue;
      }
      const synonym = doc.synonyms.find(
        (s) => s.toLowerCase() === q || s.toLowerCase().startsWith(q),
      );
      if (synonym !== undefined) {
        push({
          structure_id: doc.structure_id,
          score: synonym.toLowerCase() === q ? 80 : 75,
          matched_field: 'synonym',
          matched_text: synonym,
          doc,
        });
        continue;
      }
      if (doc.ta2_id !== null && doc.ta2_id.toLowerCase() === q) {
        push({
          structure_id: doc.structure_id,
          score: 80,
          matched_field: 'ta2_id',
          matched_text: doc.ta2_id,
          doc,
        });
        continue;
      }
      // Word-boundary containment still beats fuzzy.
      if (canonical.includes(q) || display.includes(q)) {
        push({
          structure_id: doc.structure_id,
          score: 60,
          matched_field: 'canonical_name',
          matched_text: doc.canonical_name,
          doc,
        });
      }
    }

    // Tier 3: fuzzy fallback, always scored below every exact/prefix tier.
    for (const hit of this.fuse.search(query, { limit: limit * 2 })) {
      if (!passesFilters(hit.item, filters)) continue;
      if (results.has(hit.item.structure_id)) continue;
      const fuseScore = hit.score ?? 1;
      push({
        structure_id: hit.item.structure_id,
        score: Math.max(1, 50 - fuseScore * 50),
        matched_field: 'fuzzy',
        matched_text: hit.item.canonical_name,
        doc: hit.item,
      });
    }

    return [...results.values()]
      .sort((a, b) => b.score - a.score || a.doc.canonical_name.localeCompare(b.doc.canonical_name))
      .slice(0, limit);
  }
}
