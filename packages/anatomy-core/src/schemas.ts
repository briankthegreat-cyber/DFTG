import { z } from 'zod';
import { COORDINATE_SYSTEM_ID, SHA256_PATTERN, STABLE_ID_PATTERN } from './ids';

/** Runtime validation for every imported anatomy artifact (manifests, ontology, education). */

export const IdSchema = z.string().regex(STABLE_ID_PATTERN, 'invalid stable id');

export const LateralitySchema = z.enum([
  'right',
  'left',
  'bilateral',
  'midline',
  'not_applicable',
  'unknown',
]);
export type Laterality = z.infer<typeof LateralitySchema>;

export const SexSpecificitySchema = z.enum(['shared', 'male', 'female', 'unknown']);
export type SexSpecificity = z.infer<typeof SexSpecificitySchema>;

export const LifeStageSchema = z.enum(['adult', 'embryonic', 'fetal', 'neonatal', 'unknown']);
export type LifeStage = z.infer<typeof LifeStageSchema>;

export const EducationalPrioritySchema = z.enum([
  'core',
  'exam_relevant',
  'advanced',
  'reference',
  'unknown',
]);
export type EducationalPriority = z.infer<typeof EducationalPrioritySchema>;

export const ReleasePolicySchema = z.enum([
  'internal_development',
  'external_preview',
  'commercial_release',
]);
export type ReleasePolicy = z.infer<typeof ReleasePolicySchema>;

export const LicenseStatusSchema = z.enum([
  'approved',
  'pending_review',
  'blocked_distribution',
  'development_fixture',
]);
export type LicenseStatus = z.infer<typeof LicenseStatusSchema>;

export const LicenseRecordSchema = z.object({
  status: LicenseStatusSchema,
  license_id: z.string().optional(),
  allowed_policies: z.array(ReleasePolicySchema),
  attribution: z.string().optional(),
  notes: z.string().optional(),
});
export type LicenseRecord = z.infer<typeof LicenseRecordSchema>;

export const Vec3Schema = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3 = z.infer<typeof Vec3Schema>;

export const Bounds3Schema = z.object({ min: Vec3Schema, max: Vec3Schema });
export type Bounds3 = z.infer<typeof Bounds3Schema>;

export const ContentCitationSchema = z.object({
  label: z.string().min(1),
  kind: z.enum([
    'development_fixture',
    'terminologia_anatomica',
    'textbook',
    'journal',
    'dataset',
    'other',
  ]),
  reference: z.string().optional(),
});
export type ContentCitation = z.infer<typeof ContentCitationSchema>;

export const AnatomicalRelationshipSchema = z.object({
  type: z.string().min(1),
  target_structure_id: IdSchema,
  description: z.string().optional(),
});
export type AnatomicalRelationship = z.infer<typeof AnatomicalRelationshipSchema>;

export const GltfNodeRefSchema = z.object({
  index: z.number().int().nonnegative(),
  name: z.string().min(1),
  mesh_index: z.number().int().nonnegative(),
});
export type GltfNodeRef = z.infer<typeof GltfNodeRefSchema>;

export const GeometryBindingSchema = z.object({
  geometry_id: IdSchema,
  structure_id: IdSchema,
  object_id: z.string().nullish(),
  instance_id: z.string().nullish(),
  canonical_name: z.string().min(1),
  display_name: z.string().optional(),
  synonyms: z.array(z.string()).optional(),
  system: z.string().min(1),
  subsystem: z.string().nullish(),
  region: z.string().nullish(),
  parent_id: IdSchema.nullish(),
  children: z.array(IdSchema).optional(),
  laterality: LateralitySchema,
  sex_specificity: SexSpecificitySchema.optional(),
  life_stage: LifeStageSchema.optional(),
  canonical_owner: z.string().min(1),
  asset_path: z.string().min(1),
  gltf_node: GltfNodeRefSchema,
  coordinate_system_id: z.literal(COORDINATE_SYSTEM_ID),
  selectable: z.boolean(),
  educational_priority: EducationalPrioritySchema.optional(),
  anatomical_relationships: z.array(AnatomicalRelationshipSchema).optional(),
  hierarchy_path: z.array(z.string()).optional(),
  source: z.record(z.unknown()),
  license: LicenseRecordSchema,
  version: z.string().min(1),
  asset_sha256: z.string().regex(SHA256_PATTERN).optional(),
  mapping_status: z.string().optional(),
  qa_status: z.record(z.unknown()),
  world_bounds_m: Bounds3Schema.nullish(),
  role: z.string().optional(),
});
export type GeometryBinding = z.infer<typeof GeometryBindingSchema>;

export const BundleStageSchema = z.enum(['development_fixture', 'preliminary', 'production']);
export type BundleStage = z.infer<typeof BundleStageSchema>;

export const BundleManifestSchema = z
  .object({
    schema_version: z.string().min(1),
    bundle_id: IdSchema,
    display_name: z.string().min(1),
    system: z.string().min(1),
    stage: BundleStageSchema,
    coordinate_system_id: z.literal(COORDINATE_SYSTEM_ID),
    asset_path: z.string().min(1),
    asset_sha256: z.string().regex(SHA256_PATTERN).optional(),
    asset_byte_length: z.number().int().positive().optional(),
    development_fixture: z.boolean().default(false),
    bindings: z.array(GeometryBindingSchema).min(1),
  })
  .superRefine((manifest, ctx) => {
    const seen = new Set<string>();
    for (const binding of manifest.bindings) {
      if (seen.has(binding.geometry_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate geometry_id "${binding.geometry_id}" in bundle "${manifest.bundle_id}"`,
          path: ['bindings'],
        });
      }
      seen.add(binding.geometry_id);
    }
  });
export type BundleManifest = z.infer<typeof BundleManifestSchema>;

export const MasterIndexBundleSchema = z.object({
  bundle_id: IdSchema,
  system: z.string().min(1),
  display_name: z.string().min(1),
  manifest_path: z.string().min(1),
  development_fixture: z.boolean().default(false),
  approx_byte_length: z.number().int().nonnegative().optional(),
  /** Bundles the app should request as soon as Explore opens. */
  initial: z.boolean().default(false),
});
export type MasterIndexBundle = z.infer<typeof MasterIndexBundleSchema>;

export const MasterIndexSchema = z.object({
  schema_version: z.string().min(1),
  generated_at: z.string().min(1),
  coordinate_system_id: z.literal(COORDINATE_SYSTEM_ID),
  release_stage: BundleStageSchema,
  ontology_path: z.string().min(1),
  education_path: z.string().min(1),
  lessons_path: z.string().min(1),
  quiz_path: z.string().min(1),
  bundles: z.array(MasterIndexBundleSchema).min(1),
});
export type MasterIndex = z.infer<typeof MasterIndexSchema>;

export const OntologyStructureSchema = z.object({
  structure_id: IdSchema,
  canonical_name: z.string().min(1),
  display_name: z.string().optional(),
  synonyms: z.array(z.string()).default([]),
  system: z.string().min(1),
  region: z.string().nullish(),
  parent_id: IdSchema.nullable(),
  laterality: LateralitySchema,
  sex_specificity: SexSpecificitySchema.default('unknown'),
  life_stage: LifeStageSchema.default('unknown'),
  educational_priority: EducationalPrioritySchema.default('unknown'),
  selectable: z.boolean().default(true),
  ta2_id: z.string().nullish(),
  source: z.record(z.unknown()),
  development_fixture: z.boolean().default(false),
});
export type OntologyStructure = z.infer<typeof OntologyStructureSchema>;

export const OntologyFileSchema = z.object({
  schema_version: z.string().min(1),
  structures: z.array(OntologyStructureSchema),
});
export type OntologyFile = z.infer<typeof OntologyFileSchema>;

export const EducationalRecordSchema = z.object({
  structure_id: IdSchema,
  title: z.string().min(1),
  short_description: z.string().optional(),
  overview: z.string().optional(),
  function: z.array(z.string()).optional(),
  attachments: z
    .object({
      origin: z.array(z.string()).optional(),
      insertion: z.array(z.string()).optional(),
    })
    .optional(),
  innervation: z.array(z.string()).optional(),
  blood_supply: z.array(z.string()).optional(),
  drainage: z.array(z.string()).optional(),
  anatomical_relations: z.array(z.string()).optional(),
  clinical_notes: z.array(z.string()).optional(),
  quiz_facts: z.array(z.string()).optional(),
  citations: z.array(ContentCitationSchema),
  reviewed_status: z.enum(['draft', 'reviewed', 'approved']),
  reviewed_by: z.array(z.string()).optional(),
  content_version: z.string().min(1),
  development_fixture: z.boolean().default(false),
});
export type EducationalRecord = z.infer<typeof EducationalRecordSchema>;

export const EducationFileSchema = z.object({
  schema_version: z.string().min(1),
  records: z.array(EducationalRecordSchema),
});
export type EducationFile = z.infer<typeof EducationFileSchema>;

export const QuizQuestionSchema = z.object({
  id: IdSchema,
  type: z.enum(['identify_on_model', 'multiple_choice']),
  prompt: z.string().min(1),
  target_structure_ids: z.array(IdSchema).min(1),
  accepted_structure_ids: z.array(IdSchema).optional(),
  distractor_structure_ids: z.array(IdSchema).optional(),
  system: z.string().optional(),
  region: z.string().optional(),
  difficulty: z.enum(['introductory', 'intermediate', 'advanced']).optional(),
  explanation: z.string().optional(),
  citations: z.array(ContentCitationSchema).optional(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizFileSchema = z.object({
  schema_version: z.string().min(1),
  questions: z.array(QuizQuestionSchema),
});
export type QuizFile = z.infer<typeof QuizFileSchema>;

export const LessonStepSchema = z.object({
  step_id: IdSchema,
  structure_id: IdSchema,
  title: z.string().min(1),
  instruction: z.string().min(1),
});
export type LessonStep = z.infer<typeof LessonStepSchema>;

export const LessonSchema = z.object({
  lesson_id: IdSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  system: z.string().optional(),
  steps: z.array(LessonStepSchema).min(1),
  citations: z.array(ContentCitationSchema).optional(),
  development_fixture: z.boolean().default(false),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const LessonsFileSchema = z.object({
  schema_version: z.string().min(1),
  lessons: z.array(LessonSchema),
});
export type LessonsFile = z.infer<typeof LessonsFileSchema>;
