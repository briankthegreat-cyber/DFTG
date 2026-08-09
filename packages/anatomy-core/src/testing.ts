import { COORDINATE_SYSTEM_ID } from './ids';
import type { BundleManifest, GeometryBinding, OntologyStructure, QuizQuestion } from './schemas';

/**
 * Builders for unit tests. Everything produced here is explicitly marked as
 * development fixture data and must never leak into production content.
 */

export function makeStructure(overrides: Partial<OntologyStructure> = {}): OntologyStructure {
  return {
    structure_id: 'TEST-S-A',
    canonical_name: 'Test Structure A',
    synonyms: [],
    system: 'test_system',
    region: null,
    parent_id: null,
    laterality: 'midline',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'unknown',
    selectable: true,
    ta2_id: null,
    source: { kind: 'development_fixture' },
    development_fixture: true,
    ...overrides,
  };
}

export function makeBinding(overrides: Partial<GeometryBinding> = {}): GeometryBinding {
  return {
    geometry_id: 'TEST-G-A',
    structure_id: 'TEST-S-A',
    canonical_name: 'Test Structure A',
    system: 'test_system',
    laterality: 'midline',
    canonical_owner: 'development_fixture',
    asset_path: 'model.glb',
    gltf_node: { index: 1, name: 'TEST-G-A', mesh_index: 0 },
    coordinate_system_id: COORDINATE_SYSTEM_ID,
    selectable: true,
    source: { kind: 'development_fixture' },
    license: {
      status: 'development_fixture',
      allowed_policies: ['internal_development', 'external_preview', 'commercial_release'],
    },
    version: '1.0.0-fixture',
    qa_status: { container: 'pass', note: 'development fixture — not medically reviewed' },
    ...overrides,
  };
}

export function makeManifest(overrides: Partial<BundleManifest> = {}): BundleManifest {
  return {
    schema_version: '1.1.0',
    bundle_id: 'test-bundle',
    display_name: 'Test Bundle',
    system: 'test_system',
    stage: 'development_fixture',
    coordinate_system_id: COORDINATE_SYSTEM_ID,
    asset_path: 'model.glb',
    development_fixture: true,
    bindings: [makeBinding()],
    ...overrides,
  };
}

export function makeQuizQuestion(overrides: Partial<QuizQuestion> = {}): QuizQuestion {
  return {
    id: 'TEST-Q-1',
    type: 'identify_on_model',
    prompt: 'Select Test Structure A on the model.',
    target_structure_ids: ['TEST-S-A'],
    ...overrides,
  };
}
