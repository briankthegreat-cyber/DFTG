import type { BundleManifest, GeometryBinding, OntologyStructure } from './schemas';

/**
 * Normalized, ID-keyed anatomy indices built from the ontology file plus every
 * known bundle manifest. Geometry (GLB bytes) is NOT required to build this —
 * search, hierarchy, and details must work before any geometry loads.
 */

export interface IngestionIssue {
  severity: 'error' | 'warning';
  code:
    | 'duplicate_structure_id'
    | 'duplicate_geometry_id'
    | 'orphan_parent'
    | 'hierarchy_cycle'
    | 'binding_without_structure'
    | 'binding_structure_conflict';
  message: string;
  ref?: string;
}

export interface SystemInfo {
  system: string;
  display_name: string;
  bundle_ids: string[];
  structure_count: number;
}

export interface AnatomyIndex {
  structuresById: Map<string, OntologyStructure>;
  /** Ordered child structure ids per parent structure id. */
  childrenByParentId: Map<string, string[]>;
  rootStructureIds: string[];
  bindingsByGeometryId: Map<string, GeometryBinding>;
  bindingsByStructureId: Map<string, GeometryBinding[]>;
  bundleIdsByStructureId: Map<string, string[]>;
  manifestsByBundleId: Map<string, BundleManifest>;
  systems: SystemInfo[];
  issues: IngestionIssue[];
}

export interface AnatomyIndexInput {
  structures: OntologyStructure[];
  manifests: BundleManifest[];
  /** Optional display names for systems, keyed by system id. */
  systemDisplayNames?: Record<string, string>;
}

/** Structure synthesized when a binding references a structure the ontology doesn't know. */
function structureFromBinding(binding: GeometryBinding): OntologyStructure {
  return {
    structure_id: binding.structure_id,
    canonical_name: binding.canonical_name,
    display_name: binding.display_name,
    synonyms: binding.synonyms ?? [],
    system: binding.system,
    region: binding.region ?? null,
    parent_id: binding.parent_id ?? null,
    laterality: binding.laterality,
    sex_specificity: binding.sex_specificity ?? 'unknown',
    life_stage: binding.life_stage ?? 'unknown',
    educational_priority: binding.educational_priority ?? 'unknown',
    selectable: binding.selectable,
    ta2_id: null,
    source: { synthesized_from_binding: true, bundle_asset: binding.asset_path },
    development_fixture: binding.license.status === 'development_fixture',
  };
}

export function buildAnatomyIndex(input: AnatomyIndexInput): AnatomyIndex {
  const issues: IngestionIssue[] = [];
  const structuresById = new Map<string, OntologyStructure>();

  for (const structure of input.structures) {
    if (structuresById.has(structure.structure_id)) {
      issues.push({
        severity: 'error',
        code: 'duplicate_structure_id',
        message: `duplicate structure_id "${structure.structure_id}" in ontology; keeping first`,
        ref: structure.structure_id,
      });
      continue;
    }
    structuresById.set(structure.structure_id, structure);
  }

  const bindingsByGeometryId = new Map<string, GeometryBinding>();
  const bindingsByStructureId = new Map<string, GeometryBinding[]>();
  const bundleIdsByStructureId = new Map<string, string[]>();
  const manifestsByBundleId = new Map<string, BundleManifest>();

  for (const manifest of input.manifests) {
    manifestsByBundleId.set(manifest.bundle_id, manifest);
    for (const binding of manifest.bindings) {
      if (bindingsByGeometryId.has(binding.geometry_id)) {
        issues.push({
          severity: 'error',
          code: 'duplicate_geometry_id',
          message: `duplicate geometry_id "${binding.geometry_id}" (bundle "${manifest.bundle_id}"); keeping first`,
          ref: binding.geometry_id,
        });
        continue;
      }
      bindingsByGeometryId.set(binding.geometry_id, binding);

      if (!structuresById.has(binding.structure_id)) {
        issues.push({
          severity: 'warning',
          code: 'binding_without_structure',
          message: `binding "${binding.geometry_id}" references structure "${binding.structure_id}" missing from ontology; synthesizing entry`,
          ref: binding.structure_id,
        });
        structuresById.set(binding.structure_id, structureFromBinding(binding));
      }

      const list = bindingsByStructureId.get(binding.structure_id) ?? [];
      list.push(binding);
      bindingsByStructureId.set(binding.structure_id, list);

      const bundles = bundleIdsByStructureId.get(binding.structure_id) ?? [];
      if (!bundles.includes(manifest.bundle_id)) bundles.push(manifest.bundle_id);
      bundleIdsByStructureId.set(binding.structure_id, bundles);
    }
  }

  // Parent/child wiring with orphan + cycle detection.
  const childrenByParentId = new Map<string, string[]>();
  const rootStructureIds: string[] = [];

  const effectiveParent = new Map<string, string | null>();
  for (const structure of structuresById.values()) {
    let parent = structure.parent_id;
    if (parent !== null && !structuresById.has(parent)) {
      issues.push({
        severity: 'warning',
        code: 'orphan_parent',
        message: `structure "${structure.structure_id}" references missing parent "${parent}"; treating as root`,
        ref: structure.structure_id,
      });
      parent = null;
    }
    effectiveParent.set(structure.structure_id, parent);
  }

  // Cycle detection: walk parent chains; any structure on a cycle becomes a root.
  const state = new Map<string, 'visiting' | 'done'>();
  for (const id of structuresById.keys()) {
    if (state.get(id) === 'done') continue;
    const chain: string[] = [];
    let current: string | null = id;
    while (current !== null && state.get(current) === undefined) {
      state.set(current, 'visiting');
      chain.push(current);
      current = effectiveParent.get(current) ?? null;
    }
    if (current !== null && state.get(current) === 'visiting') {
      // Found a cycle; break it at the re-entry point.
      issues.push({
        severity: 'error',
        code: 'hierarchy_cycle',
        message: `hierarchy cycle detected involving "${current}"; breaking cycle at this structure`,
        ref: current,
      });
      effectiveParent.set(current, null);
    }
    for (const visited of chain) state.set(visited, 'done');
  }

  for (const id of structuresById.keys()) {
    const parent = effectiveParent.get(id) ?? null;
    if (parent === null) {
      rootStructureIds.push(id);
    } else {
      const list = childrenByParentId.get(parent) ?? [];
      list.push(id);
      childrenByParentId.set(parent, list);
    }
  }

  // Systems roll-up from ontology + manifests.
  const systemMap = new Map<string, SystemInfo>();
  for (const structure of structuresById.values()) {
    const info = systemMap.get(structure.system) ?? {
      system: structure.system,
      display_name: input.systemDisplayNames?.[structure.system] ?? structure.system,
      bundle_ids: [],
      structure_count: 0,
    };
    info.structure_count += 1;
    systemMap.set(structure.system, info);
  }
  for (const manifest of manifestsByBundleId.values()) {
    const info = systemMap.get(manifest.system) ?? {
      system: manifest.system,
      display_name: input.systemDisplayNames?.[manifest.system] ?? manifest.system,
      bundle_ids: [],
      structure_count: 0,
    };
    if (!info.bundle_ids.includes(manifest.bundle_id)) info.bundle_ids.push(manifest.bundle_id);
    systemMap.set(manifest.system, info);
  }

  return {
    structuresById,
    childrenByParentId,
    rootStructureIds,
    bindingsByGeometryId,
    bindingsByStructureId,
    bundleIdsByStructureId,
    manifestsByBundleId,
    systems: [...systemMap.values()].sort((a, b) => a.system.localeCompare(b.system)),
    issues,
  };
}

/** Ancestor chain (nearest parent first, root last). Safe on broken hierarchies. */
export function getAncestors(index: AnatomyIndex, structureId: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>([structureId]);
  let current = index.structuresById.get(structureId)?.parent_id ?? null;
  while (current !== null && !seen.has(current)) {
    const structure = index.structuresById.get(current);
    if (!structure) break;
    out.push(current);
    seen.add(current);
    current = structure.parent_id;
  }
  return out;
}

/** All descendant structure ids (depth-first), excluding the given structure. */
export function getDescendants(index: AnatomyIndex, structureId: string): string[] {
  const out: string[] = [];
  const stack = [...(index.childrenByParentId.get(structureId) ?? [])];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === undefined || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    stack.push(...(index.childrenByParentId.get(id) ?? []));
  }
  return out;
}
