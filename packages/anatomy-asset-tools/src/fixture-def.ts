import { COORDINATE_SYSTEM_ID } from '@anatomy/core';
import type {
  Bounds3,
  BundleManifest,
  ContentCitation,
  EducationalRecord,
  GeometryBinding,
  Lesson,
  LicenseRecord,
  OntologyStructure,
  QuizQuestion,
} from '@anatomy/core';
import type { GlbSceneSpec, PrimitiveSpec } from './glb';

/**
 * The development fixture: synthetic, explicitly non-medical content used to
 * exercise the full asset pipeline (bundles, ontology, education, quiz,
 * lessons, license gates) before any real anatomy content exists.
 */

export const FIXTURE_SCHEMA_VERSION = '1.1.0';
export const FIXTURE_GENERATED_AT = '2026-08-08T00:00:00Z';
export const FIXTURE_CONTENT_VERSION = '1.0.0-fixture';

export const FIXTURE_CITATION: ContentCitation = {
  label: 'Development fixture — synthetic, non-medical content',
  kind: 'development_fixture',
};

export interface FixtureSystemDef {
  system: string;
  display_name: string;
}

export const FIXTURE_SYSTEMS: FixtureSystemDef[] = [
  { system: 'fixture_frame', display_name: 'Fixture Frame (dev)' },
  { system: 'fixture_core', display_name: 'Fixture Core (dev)' },
];

export const COORDINATE_CONTRACT_PATH = 'contracts/coordinate_system_v1_1.json';

export const COORDINATE_CONTRACT_V1_1 = {
  coordinate_system_id: COORDINATE_SYSTEM_ID,
  handedness: 'right',
  units: 'meters',
  axes: {
    '+X': 'patient_left',
    '-X': 'patient_right',
    '+Y': 'superior',
    '-Y': 'inferior',
    '+Z': 'anterior',
    '-Z': 'posterior',
  },
  origin: {
    y0: 'support_plane',
    x0: 'midsagittal_plane',
    z0: 'midpoint_between_heel_centers',
  },
  pose: 'neutral_adult_anatomical_position',
  root_transform: 'identity_baked_vertices',
  note: 'Development copy of the coordinate contract values for fixture use. Replace with the authoritative production contract file when available.',
} as const;

export const FIXTURE_INDEX_METADATA = {
  schema_version: FIXTURE_SCHEMA_VERSION,
  release_stage: 'development_fixture',
  ontology_path: 'ontology/structures.json',
  education_path: 'education/records.json',
  lessons_path: 'education/lessons.json',
  quiz_path: 'education/quiz-questions.json',
} as const;

const FIXTURE_SOURCE = { kind: 'development_fixture' } as const;

export const FIXTURE_STRUCTURES: OntologyStructure[] = [
  {
    structure_id: 'FIX-S-FRAME-ROOT',
    canonical_name: 'Fixture Frame Assembly',
    synonyms: [],
    system: 'fixture_frame',
    region: null,
    parent_id: null,
    laterality: 'midline',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'reference',
    selectable: false,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-CORE-ROOT',
    canonical_name: 'Fixture Core Assembly',
    synonyms: [],
    system: 'fixture_core',
    region: null,
    parent_id: null,
    laterality: 'midline',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'reference',
    selectable: false,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-TRUNK',
    canonical_name: 'Fixture Trunk Column',
    synonyms: ['torso block', 'central column'],
    system: 'fixture_frame',
    region: 'fixture_axial',
    parent_id: 'FIX-S-FRAME-ROOT',
    laterality: 'midline',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'core',
    selectable: true,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-HEAD',
    canonical_name: 'Fixture Head Block',
    synonyms: ['cephalic block'],
    system: 'fixture_frame',
    region: 'fixture_cephalic',
    parent_id: 'FIX-S-TRUNK',
    laterality: 'midline',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'core',
    selectable: true,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-ARM-L',
    canonical_name: 'Fixture Arm Assembly (left)',
    synonyms: ['left limb assembly'],
    system: 'fixture_frame',
    region: 'fixture_appendage',
    parent_id: 'FIX-S-TRUNK',
    laterality: 'left',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'core',
    selectable: true,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-ARM-R',
    canonical_name: 'Fixture Arm Assembly (right)',
    synonyms: ['right limb assembly'],
    system: 'fixture_frame',
    region: 'fixture_appendage',
    parent_id: 'FIX-S-TRUNK',
    laterality: 'right',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'core',
    selectable: true,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-LEG-L',
    canonical_name: 'Fixture Leg Pillar (left)',
    synonyms: ['left pillar'],
    system: 'fixture_frame',
    region: 'fixture_base',
    parent_id: 'FIX-S-FRAME-ROOT',
    laterality: 'left',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'reference',
    selectable: true,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-LEG-R',
    canonical_name: 'Fixture Leg Pillar (right)',
    synonyms: ['right pillar'],
    system: 'fixture_frame',
    region: 'fixture_base',
    parent_id: 'FIX-S-FRAME-ROOT',
    laterality: 'right',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'reference',
    selectable: true,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-PLATE',
    canonical_name: 'Fixture Base Plate',
    synonyms: ['support plate', 'ground plate'],
    system: 'fixture_frame',
    region: 'fixture_base',
    parent_id: 'FIX-S-FRAME-ROOT',
    laterality: 'midline',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'exam_relevant',
    selectable: true,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-CORE-A',
    canonical_name: 'Fixture Core Node A',
    synonyms: ['inner node alpha'],
    system: 'fixture_core',
    region: 'fixture_internal',
    parent_id: 'FIX-S-CORE-ROOT',
    laterality: 'midline',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'core',
    selectable: true,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-CORE-B',
    canonical_name: 'Fixture Core Node B',
    synonyms: ['inner node beta'],
    system: 'fixture_core',
    region: 'fixture_internal',
    parent_id: 'FIX-S-CORE-ROOT',
    laterality: 'midline',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'exam_relevant',
    selectable: true,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-RESTRICTED',
    canonical_name: 'Fixture Restricted Block',
    synonyms: ['license test block'],
    system: 'fixture_core',
    region: 'fixture_internal',
    parent_id: 'FIX-S-CORE-ROOT',
    laterality: 'midline',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'reference',
    selectable: true,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-GHOST',
    canonical_name: 'Fixture Ghost Node',
    synonyms: ['missing geometry example'],
    system: 'fixture_core',
    region: 'fixture_internal',
    parent_id: 'FIX-S-CORE-ROOT',
    laterality: 'midline',
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    educational_priority: 'reference',
    selectable: true,
    ta2_id: null,
    source: FIXTURE_SOURCE,
    development_fixture: true,
  },
];

const FIXTURE_LICENSE: LicenseRecord = {
  status: 'development_fixture',
  allowed_policies: ['internal_development', 'external_preview', 'commercial_release'],
  notes: 'Synthetic fixture geometry',
};

const RESTRICTED_LICENSE: LicenseRecord = {
  status: 'blocked_distribution',
  allowed_policies: ['internal_development'],
  notes: 'Deliberately blocked fixture node for license-gate testing',
};

export interface FixtureNodeDef {
  geometry_id: string;
  structure_id: string;
  display_name?: string;
  primitives: PrimitiveSpec[];
  license: LicenseRecord;
}

export interface FixtureBundleDef {
  bundle_id: string;
  system: string;
  display_name: string;
  root_node_name: string;
  initial: boolean;
  /** Optional decoder wiring exercised by this synthetic fixture bundle. */
  encodings?: BundleManifest['encodings'];
  nodes: FixtureNodeDef[];
}

export const FIXTURE_FRAME_BUNDLE: FixtureBundleDef = {
  bundle_id: 'fixture-frame',
  system: 'fixture_frame',
  display_name: 'Fixture Frame (dev)',
  root_node_name: 'FIX-ORG-FRAME',
  initial: true,
  nodes: [
    {
      geometry_id: 'FIX-G-TRUNK',
      structure_id: 'FIX-S-TRUNK',
      primitives: [
        { box: { center: [0, 1.15, 0], size: [0.36, 0.55, 0.22] }, colorHex: '#cfc6b8' },
      ],
      license: FIXTURE_LICENSE,
    },
    {
      geometry_id: 'FIX-G-HEAD',
      structure_id: 'FIX-S-HEAD',
      primitives: [
        { box: { center: [0, 1.62, 0], size: [0.22, 0.24, 0.22] }, colorHex: '#d7cfc2' },
      ],
      license: FIXTURE_LICENSE,
    },
    {
      geometry_id: 'FIX-G-ARM-L-UPPER',
      structure_id: 'FIX-S-ARM-L',
      display_name: 'Fixture Arm Assembly (left) — upper segment',
      primitives: [
        { box: { center: [0.3, 1.28, 0], size: [0.1, 0.3, 0.12] }, colorHex: '#c9c0b2' },
      ],
      license: FIXTURE_LICENSE,
    },
    {
      geometry_id: 'FIX-G-ARM-L-LOWER',
      structure_id: 'FIX-S-ARM-L',
      display_name: 'Fixture Arm Assembly (left) — lower segment',
      primitives: [
        { box: { center: [0.3, 0.94, 0], size: [0.09, 0.28, 0.1] }, colorHex: '#c9c0b2' },
      ],
      license: FIXTURE_LICENSE,
    },
    {
      geometry_id: 'FIX-G-ARM-R',
      structure_id: 'FIX-S-ARM-R',
      primitives: [
        { box: { center: [-0.3, 1.11, 0], size: [0.1, 0.62, 0.11] }, colorHex: '#c9c0b2' },
      ],
      license: FIXTURE_LICENSE,
    },
    {
      geometry_id: 'FIX-G-LEG-L',
      structure_id: 'FIX-S-LEG-L',
      primitives: [
        { box: { center: [0.11, 0.44, 0], size: [0.13, 0.86, 0.15] }, colorHex: '#c2b9ab' },
      ],
      license: FIXTURE_LICENSE,
    },
    {
      geometry_id: 'FIX-G-LEG-R',
      structure_id: 'FIX-S-LEG-R',
      primitives: [
        { box: { center: [-0.11, 0.44, 0], size: [0.13, 0.86, 0.15] }, colorHex: '#c2b9ab' },
      ],
      license: FIXTURE_LICENSE,
    },
    {
      geometry_id: 'FIX-G-PLATE',
      structure_id: 'FIX-S-PLATE',
      primitives: [
        { box: { center: [0, 0.008, 0], size: [0.7, 0.016, 0.44] }, colorHex: '#6b7280' },
        { box: { center: [0, 0.024, 0.2], size: [0.7, 0.016, 0.03] }, colorHex: '#8b93a3' },
      ],
      license: FIXTURE_LICENSE,
    },
  ],
};

export const FIXTURE_CORE_BUNDLE: FixtureBundleDef = {
  bundle_id: 'fixture-core',
  system: 'fixture_core',
  display_name: 'Fixture Core (dev)',
  root_node_name: 'FIX-ORG-CORE',
  initial: false,
  // The geometry is deliberately tiny/uncompressed; declaring meshopt here
  // exercises the manifest-driven decoder path without adding an encoder dependency.
  encodings: ['meshopt'],
  nodes: [
    {
      geometry_id: 'FIX-G-CORE-A',
      structure_id: 'FIX-S-CORE-A',
      primitives: [
        { box: { center: [0, 1.22, 0.04], size: [0.1, 0.12, 0.08] }, colorHex: '#b0575f' },
      ],
      license: FIXTURE_LICENSE,
    },
    {
      geometry_id: 'FIX-G-CORE-B',
      structure_id: 'FIX-S-CORE-B',
      primitives: [
        { box: { center: [0, 1.02, 0.02], size: [0.14, 0.1, 0.09] }, colorHex: '#5f7fb0' },
      ],
      license: FIXTURE_LICENSE,
    },
    {
      geometry_id: 'FIX-G-RESTRICTED',
      structure_id: 'FIX-S-RESTRICTED',
      primitives: [
        { box: { center: [0, 1.12, -0.05], size: [0.08, 0.08, 0.06] }, colorHex: '#7a5fb0' },
      ],
      license: RESTRICTED_LICENSE,
    },
  ],
};

export const FIXTURE_BUNDLES: FixtureBundleDef[] = [FIXTURE_FRAME_BUNDLE, FIXTURE_CORE_BUNDLE];

const structuresById = new Map(FIXTURE_STRUCTURES.map((s) => [s.structure_id, s]));

function requireStructure(structureId: string): OntologyStructure {
  const structure = structuresById.get(structureId);
  if (!structure) {
    throw new Error(`fixture node references unknown structure "${structureId}"`);
  }
  return structure;
}

/** Ancestor canonical names, root first, excluding the structure itself. */
function hierarchyPath(structureId: string): string[] {
  const names: string[] = [];
  let parentId = requireStructure(structureId).parent_id;
  while (parentId !== null) {
    const parent = structuresById.get(parentId);
    if (!parent) break;
    names.unshift(parent.canonical_name);
    parentId = parent.parent_id;
  }
  return names;
}

function primitiveBounds(primitive: PrimitiveSpec): Bounds3 {
  const [cx, cy, cz] = primitive.box.center;
  const [sx, sy, sz] = primitive.box.size;
  return {
    min: [cx - sx / 2, cy - sy / 2, cz - sz / 2],
    max: [cx + sx / 2, cy + sy / 2, cz + sz / 2],
  };
}

function unionBounds(a: Bounds3, b: Bounds3): Bounds3 {
  return {
    min: [Math.min(a.min[0], b.min[0]), Math.min(a.min[1], b.min[1]), Math.min(a.min[2], b.min[2])],
    max: [Math.max(a.max[0], b.max[0]), Math.max(a.max[1], b.max[1]), Math.max(a.max[2], b.max[2])],
  };
}

function nodeBounds(node: FixtureNodeDef): Bounds3 {
  const first = node.primitives[0];
  if (first === undefined) {
    throw new Error(`fixture node "${node.geometry_id}" has no primitives`);
  }
  return node.primitives
    .slice(1)
    .reduce((acc, p) => unionBounds(acc, primitiveBounds(p)), primitiveBounds(first));
}

function bindingForNode(node: FixtureNodeDef, nodeIndex: number): GeometryBinding {
  const structure = requireStructure(node.structure_id);
  return {
    geometry_id: node.geometry_id,
    structure_id: node.structure_id,
    canonical_name: structure.canonical_name,
    ...(node.display_name !== undefined ? { display_name: node.display_name } : {}),
    synonyms: structure.synonyms,
    system: structure.system,
    subsystem: null,
    region: structure.region ?? null,
    parent_id: structure.parent_id,
    laterality: structure.laterality,
    sex_specificity: 'unknown',
    life_stage: 'unknown',
    canonical_owner: 'development_fixture',
    asset_path: 'model.glb',
    gltf_node: { index: nodeIndex, name: node.geometry_id, mesh_index: nodeIndex - 1 },
    coordinate_system_id: COORDINATE_SYSTEM_ID,
    selectable: true,
    educational_priority: structure.educational_priority,
    hierarchy_path: hierarchyPath(node.structure_id),
    source: { kind: 'development_fixture', generator: '@anatomy/asset-tools' },
    license: node.license,
    version: FIXTURE_CONTENT_VERSION,
    mapping_status: 'exact',
    qa_status: { container: 'pass', anatomical_review: 'not_applicable_development_fixture' },
    world_bounds_m: nodeBounds(node),
  };
}

/** Manifest without asset hashes; the generator CLI adds asset_sha256/byte length. */
export function buildFixtureBundleManifest(def: FixtureBundleDef): BundleManifest {
  return {
    schema_version: FIXTURE_SCHEMA_VERSION,
    bundle_id: def.bundle_id,
    display_name: def.display_name,
    system: def.system,
    stage: 'development_fixture',
    coordinate_system_id: COORDINATE_SYSTEM_ID,
    asset_path: 'model.glb',
    ...(def.encodings !== undefined ? { encodings: def.encodings } : {}),
    development_fixture: true,
    bindings: def.nodes.map((node, i) => bindingForNode(node, i + 1)),
  };
}

export function buildFixtureGlbSpec(def: FixtureBundleDef): GlbSceneSpec {
  return {
    rootNodeName: def.root_node_name,
    generator: '@anatomy/asset-tools',
    nodes: def.nodes.map((node) => ({ name: node.geometry_id, primitives: node.primitives })),
  };
}

const SYNTHETIC_OVERVIEW =
  'Synthetic development-fixture geometry used to verify selection, visibility, and camera behavior. It does not represent human anatomy.';

export const FIXTURE_EDUCATION_RECORDS: EducationalRecord[] = [
  {
    structure_id: 'FIX-S-TRUNK',
    title: 'Fixture Trunk Column',
    short_description: 'Central synthetic block of the development fixture frame.',
    overview: SYNTHETIC_OVERVIEW,
    function: ['Acts as the central reference block for selection and camera-framing checks.'],
    quiz_facts: ['The trunk column is centered on the midline at X = 0.'],
    citations: [FIXTURE_CITATION],
    reviewed_status: 'draft',
    content_version: FIXTURE_CONTENT_VERSION,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-HEAD',
    title: 'Fixture Head Block',
    short_description: 'Topmost synthetic block of the development fixture frame.',
    overview: SYNTHETIC_OVERVIEW,
    anatomical_relations: ['Positioned superior (+Y) to the Fixture Trunk Column.'],
    quiz_facts: ['The head block is the most superior block in the fixture frame.'],
    citations: [FIXTURE_CITATION],
    reviewed_status: 'draft',
    content_version: FIXTURE_CONTENT_VERSION,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-ARM-L',
    title: 'Fixture Arm Assembly (left)',
    short_description: 'Synthetic two-segment assembly on the patient-left (+X) side.',
    overview:
      'Synthetic development-fixture geometry used to verify selection, visibility, and camera behavior. It is made of two geometry segments that select as one structure, and it does not represent human anatomy.',
    quiz_facts: ['Clicking either the upper or lower segment selects the whole left arm assembly.'],
    citations: [FIXTURE_CITATION],
    reviewed_status: 'draft',
    content_version: FIXTURE_CONTENT_VERSION,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-PLATE',
    title: 'Fixture Base Plate',
    short_description: 'Synthetic support plate at the canonical support plane.',
    overview: SYNTHETIC_OVERVIEW,
    anatomical_relations: [
      'Sits at Y = 0, the canonical support plane, inferior to both leg pillars.',
    ],
    quiz_facts: ['The base plate marks Y = 0 in the canonical coordinate system.'],
    citations: [FIXTURE_CITATION],
    reviewed_status: 'draft',
    content_version: FIXTURE_CONTENT_VERSION,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-CORE-A',
    title: 'Fixture Core Node A',
    short_description: 'Synthetic inner block from the fixture-core bundle.',
    overview:
      'Synthetic development-fixture geometry used to verify multi-bundle loading and selection. It does not represent human anatomy.',
    quiz_facts: ['Core Node A loads from the fixture-core bundle, not the initial frame bundle.'],
    citations: [FIXTURE_CITATION],
    reviewed_status: 'draft',
    content_version: FIXTURE_CONTENT_VERSION,
    development_fixture: true,
  },
  {
    structure_id: 'FIX-S-GHOST',
    title: 'Fixture Ghost Node',
    short_description: 'Synthetic ontology-only entry; its geometry is not yet available.',
    overview:
      'Synthetic development-fixture entry used to verify that missing geometry is reported honestly in the interface. It does not represent human anatomy.',
    citations: [FIXTURE_CITATION],
    reviewed_status: 'draft',
    content_version: FIXTURE_CONTENT_VERSION,
    development_fixture: true,
  },
];

export const FIXTURE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'FIX-Q-1',
    type: 'identify_on_model',
    prompt: 'Select the Fixture Trunk Column on the model.',
    target_structure_ids: ['FIX-S-TRUNK'],
    system: 'fixture_frame',
    difficulty: 'introductory',
    explanation: 'The trunk column is the large central block on the midline.',
    citations: [FIXTURE_CITATION],
  },
  {
    id: 'FIX-Q-2',
    type: 'identify_on_model',
    prompt: 'Select the Fixture Head Block on the model.',
    target_structure_ids: ['FIX-S-HEAD'],
    system: 'fixture_frame',
    difficulty: 'introductory',
    citations: [FIXTURE_CITATION],
  },
  {
    id: 'FIX-Q-3',
    type: 'identify_on_model',
    prompt: 'Select the Fixture Arm Assembly on the patient-left side (+X).',
    target_structure_ids: ['FIX-S-ARM-L'],
    system: 'fixture_frame',
    difficulty: 'intermediate',
    explanation: 'Both arm segments belong to one structure; clicking either counts.',
    citations: [FIXTURE_CITATION],
  },
  {
    id: 'FIX-Q-4',
    type: 'identify_on_model',
    prompt: 'Select the Fixture Base Plate at the support plane.',
    target_structure_ids: ['FIX-S-PLATE'],
    system: 'fixture_frame',
    difficulty: 'introductory',
    citations: [FIXTURE_CITATION],
  },
  {
    id: 'FIX-Q-5',
    type: 'multiple_choice',
    prompt: 'Which structure is the arm assembly on the patient-left side?',
    target_structure_ids: ['FIX-S-ARM-L'],
    distractor_structure_ids: ['FIX-S-ARM-R', 'FIX-S-LEG-L', 'FIX-S-TRUNK'],
    system: 'fixture_frame',
    difficulty: 'intermediate',
    citations: [FIXTURE_CITATION],
  },
  {
    id: 'FIX-Q-6',
    type: 'multiple_choice',
    prompt: 'Which structure is Fixture Core Node A?',
    target_structure_ids: ['FIX-S-CORE-A'],
    distractor_structure_ids: ['FIX-S-CORE-B', 'FIX-S-TRUNK', 'FIX-S-HEAD'],
    system: 'fixture_core',
    difficulty: 'introductory',
    citations: [FIXTURE_CITATION],
  },
];

export const FIXTURE_LESSON: Lesson = {
  lesson_id: 'LESSON-FIX-ORIENT',
  title: 'Fixture Orientation Tour',
  description:
    'Synthetic orientation tour over development-fixture geometry. It verifies canonical axes and selection flows and does not represent human anatomy.',
  system: 'fixture_frame',
  steps: [
    {
      step_id: 'STEP-1',
      structure_id: 'FIX-S-TRUNK',
      title: 'The central column',
      instruction: 'Start at the Fixture Trunk Column on the midline (X = 0).',
    },
    {
      step_id: 'STEP-2',
      structure_id: 'FIX-S-HEAD',
      title: 'Superior block',
      instruction: 'Move superiorly (+Y) to the Fixture Head Block.',
    },
    {
      step_id: 'STEP-3',
      structure_id: 'FIX-S-ARM-L',
      title: 'Patient-left assembly',
      instruction:
        'Patient-left is +X in canonical space; this assembly is two geometry segments that select as one structure.',
    },
    {
      step_id: 'STEP-4',
      structure_id: 'FIX-S-PLATE',
      title: 'Support plane',
      instruction: 'The base plate sits at Y = 0, the canonical support plane.',
    },
  ],
  citations: [FIXTURE_CITATION],
  development_fixture: true,
};
