import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BundleManifestSchema,
  COORDINATE_SYSTEM_ID,
  EducationFileSchema,
  LessonsFileSchema,
  MasterIndexSchema,
  OntologyFileSchema,
  QuizFileSchema,
  buildAnatomyIndex,
  findPolicyViolations,
} from '@anatomy/core';
import type { BundleManifest, OntologyStructure, ReleasePolicy } from '@anatomy/core';
import type { ZodError } from 'zod';
import { parseGlbJson } from './glb-read';

export interface Finding {
  code: string;
  message: string;
  bundle_id?: string;
  path?: string;
  expected?: string;
  actual?: string;
}

export interface ValidateAssetsOptions {
  dir: string;
  policy: ReleasePolicy;
}

export interface ValidationReport {
  errors: Finding[];
  warnings: Finding[];
  stats: Record<string, number>;
}

function describeZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function validateAssets(opts: ValidateAssetsOptions): Promise<ValidationReport> {
  const errors: Finding[] = [];
  const warnings: Finding[] = [];
  const stats: Record<string, number> = {
    bundles: 0,
    bindings: 0,
    structures: 0,
    education_records: 0,
    lessons: 0,
    quiz_questions: 0,
    asset_bytes: 0,
  };

  const readJson = async (relPath: string): Promise<unknown> => {
    const raw = await readFile(path.join(opts.dir, relPath), 'utf8');
    return JSON.parse(raw) as unknown;
  };

  let indexRaw: unknown;
  try {
    indexRaw = await readJson('index.json');
  } catch (error) {
    errors.push({
      code: 'index_read_error',
      message: `cannot read index.json: ${describeError(error)}`,
      path: 'index.json',
    });
    return { errors, warnings, stats };
  }

  if (indexRaw !== null && typeof indexRaw === 'object' && !Array.isArray(indexRaw)) {
    const declared = (indexRaw as Record<string, unknown>)['coordinate_system_id'];
    if (declared !== COORDINATE_SYSTEM_ID) {
      errors.push({
        code: 'coordinate_system_mismatch',
        message: 'index.json declares the wrong coordinate_system_id',
        path: 'index.json',
        expected: COORDINATE_SYSTEM_ID,
        actual: String(declared),
      });
    }
  }

  const indexParsed = MasterIndexSchema.safeParse(indexRaw);
  if (!indexParsed.success) {
    errors.push({
      code: 'index_invalid',
      message: `index.json failed schema validation: ${describeZodError(indexParsed.error)}`,
      path: 'index.json',
    });
    return { errors, warnings, stats };
  }
  const index = indexParsed.data;

  const manifests: BundleManifest[] = [];
  for (const entry of index.bundles) {
    stats.bundles = (stats.bundles ?? 0) + 1;
    let manifestRaw: unknown;
    try {
      manifestRaw = await readJson(entry.manifest_path);
    } catch (error) {
      errors.push({
        code: 'manifest_read_error',
        message: `cannot read manifest for bundle "${entry.bundle_id}": ${describeError(error)}`,
        bundle_id: entry.bundle_id,
        path: entry.manifest_path,
      });
      continue;
    }
    const manifestParsed = BundleManifestSchema.safeParse(manifestRaw);
    if (!manifestParsed.success) {
      errors.push({
        code: 'manifest_invalid',
        message: `manifest for bundle "${entry.bundle_id}" failed schema validation: ${describeZodError(manifestParsed.error)}`,
        bundle_id: entry.bundle_id,
        path: entry.manifest_path,
      });
      continue;
    }
    const manifest = manifestParsed.data;
    manifests.push(manifest);
    stats.bindings = (stats.bindings ?? 0) + manifest.bindings.length;

    if (manifest.system !== entry.system) {
      errors.push({
        code: 'bundle_system_mismatch',
        message: `manifest system does not match index entry for bundle "${entry.bundle_id}"`,
        bundle_id: entry.bundle_id,
        path: entry.manifest_path,
        expected: entry.system,
        actual: manifest.system,
      });
    }

    const assetRelPath = path.join(path.dirname(entry.manifest_path), manifest.asset_path);
    let assetBytes: Uint8Array | null = null;
    try {
      assetBytes = await readFile(path.join(opts.dir, assetRelPath));
    } catch (error) {
      errors.push({
        code: 'asset_missing',
        message: `asset file for bundle "${entry.bundle_id}" is missing: ${describeError(error)}`,
        bundle_id: entry.bundle_id,
        path: assetRelPath,
      });
    }
    if (assetBytes === null) continue;
    stats.asset_bytes = (stats.asset_bytes ?? 0) + assetBytes.byteLength;

    if (manifest.asset_sha256 !== undefined) {
      const actualSha = createHash('sha256').update(assetBytes).digest('hex');
      if (actualSha !== manifest.asset_sha256) {
        errors.push({
          code: 'asset_sha256_mismatch',
          message: `asset bytes for bundle "${entry.bundle_id}" do not match manifest asset_sha256`,
          bundle_id: entry.bundle_id,
          path: assetRelPath,
          expected: manifest.asset_sha256,
          actual: actualSha,
        });
      }
    }

    try {
      const { json } = parseGlbJson(assetBytes);
      json.nodes.forEach((node, nodeIndex) => {
        if (node.translation || node.rotation || node.scale || node.matrix) {
          errors.push({
            code: 'glb_node_has_transform',
            message: `glTF node ${nodeIndex} ("${node.name ?? '(unnamed)'}") in bundle "${entry.bundle_id}" carries TRS/matrix; the identity contract requires baked vertices`,
            bundle_id: entry.bundle_id,
            path: assetRelPath,
          });
        }
      });
      for (const binding of manifest.bindings) {
        const node = json.nodes[binding.gltf_node.index];
        if (node === undefined) {
          errors.push({
            code: 'glb_node_missing',
            message: `binding "${binding.geometry_id}" points at glTF node ${binding.gltf_node.index}, which does not exist (GLB has ${json.nodes.length} nodes)`,
            bundle_id: entry.bundle_id,
            path: assetRelPath,
            expected: String(binding.gltf_node.index),
            actual: `node count ${json.nodes.length}`,
          });
          continue;
        }
        if (node.name !== binding.gltf_node.name) {
          errors.push({
            code: 'glb_node_name_mismatch',
            message: `binding "${binding.geometry_id}": glTF node ${binding.gltf_node.index} name mismatch`,
            bundle_id: entry.bundle_id,
            path: assetRelPath,
            expected: binding.gltf_node.name,
            actual: node.name ?? '(unnamed)',
          });
        }
        if (node.mesh !== binding.gltf_node.mesh_index) {
          errors.push({
            code: 'glb_mesh_index_mismatch',
            message: `binding "${binding.geometry_id}": glTF node ${binding.gltf_node.index} mesh index mismatch`,
            bundle_id: entry.bundle_id,
            path: assetRelPath,
            expected: String(binding.gltf_node.mesh_index),
            actual: node.mesh === undefined ? '(no mesh)' : String(node.mesh),
          });
        }
      }
      // Reverse direction: every mesh-carrying glTF node must have a binding,
      // otherwise its bytes would render outside the license/visibility gates.
      const boundNodeIndices = new Set(manifest.bindings.map((b) => b.gltf_node.index));
      json.nodes.forEach((node, nodeIndex) => {
        if (node.mesh !== undefined && !boundNodeIndices.has(nodeIndex)) {
          errors.push({
            code: 'glb_unbound_mesh_node',
            message: `glTF node ${nodeIndex} ("${node.name ?? '(unnamed)'}") in bundle "${entry.bundle_id}" carries mesh ${node.mesh} but has no manifest binding`,
            bundle_id: entry.bundle_id,
            path: assetRelPath,
          });
        }
      });
    } catch (error) {
      errors.push({
        code: 'glb_parse_error',
        message: `cannot parse GLB for bundle "${entry.bundle_id}": ${describeError(error)}`,
        bundle_id: entry.bundle_id,
        path: assetRelPath,
      });
    }
  }

  const geometryOwner = new Map<string, string>();
  for (const manifest of manifests) {
    for (const binding of manifest.bindings) {
      const owner = geometryOwner.get(binding.geometry_id);
      if (owner !== undefined && owner !== manifest.bundle_id) {
        errors.push({
          code: 'duplicate_geometry_id_across_bundles',
          message: `geometry_id "${binding.geometry_id}" appears in both bundle "${owner}" and bundle "${manifest.bundle_id}"`,
          bundle_id: manifest.bundle_id,
        });
      } else {
        geometryOwner.set(binding.geometry_id, manifest.bundle_id);
      }
    }
  }

  let structures: OntologyStructure[] = [];
  try {
    const ontologyRaw = await readJson(index.ontology_path);
    const ontologyParsed = OntologyFileSchema.safeParse(ontologyRaw);
    if (ontologyParsed.success) {
      structures = ontologyParsed.data.structures;
    } else {
      errors.push({
        code: 'ontology_invalid',
        message: `ontology failed schema validation: ${describeZodError(ontologyParsed.error)}`,
        path: index.ontology_path,
      });
    }
  } catch (error) {
    errors.push({
      code: 'ontology_read_error',
      message: `cannot read ontology: ${describeError(error)}`,
      path: index.ontology_path,
    });
  }
  stats.structures = structures.length;

  const anatomyIndex = buildAnatomyIndex({ structures, manifests });
  for (const issue of anatomyIndex.issues) {
    const finding: Finding = { code: issue.code, message: issue.message };
    (issue.severity === 'error' ? errors : warnings).push(finding);
  }

  const checkStructureRef = (structureId: string, where: string, filePath: string): void => {
    if (!anatomyIndex.structuresById.has(structureId)) {
      errors.push({
        code: 'unknown_structure_id',
        message: `${where} references structure "${structureId}" that is not in the ontology index`,
        path: filePath,
      });
    }
  };

  try {
    const educationRaw = await readJson(index.education_path);
    const educationParsed = EducationFileSchema.safeParse(educationRaw);
    if (educationParsed.success) {
      stats.education_records = educationParsed.data.records.length;
      for (const record of educationParsed.data.records) {
        checkStructureRef(
          record.structure_id,
          `education record "${record.title}"`,
          index.education_path,
        );
      }
    } else {
      errors.push({
        code: 'education_invalid',
        message: `education records failed schema validation: ${describeZodError(educationParsed.error)}`,
        path: index.education_path,
      });
    }
  } catch (error) {
    errors.push({
      code: 'education_read_error',
      message: `cannot read education records: ${describeError(error)}`,
      path: index.education_path,
    });
  }

  try {
    const lessonsRaw = await readJson(index.lessons_path);
    const lessonsParsed = LessonsFileSchema.safeParse(lessonsRaw);
    if (lessonsParsed.success) {
      stats.lessons = lessonsParsed.data.lessons.length;
      for (const lesson of lessonsParsed.data.lessons) {
        for (const step of lesson.steps) {
          checkStructureRef(
            step.structure_id,
            `lesson "${lesson.lesson_id}" step "${step.step_id}"`,
            index.lessons_path,
          );
        }
      }
    } else {
      errors.push({
        code: 'lessons_invalid',
        message: `lessons failed schema validation: ${describeZodError(lessonsParsed.error)}`,
        path: index.lessons_path,
      });
    }
  } catch (error) {
    errors.push({
      code: 'lessons_read_error',
      message: `cannot read lessons: ${describeError(error)}`,
      path: index.lessons_path,
    });
  }

  try {
    const quizRaw = await readJson(index.quiz_path);
    const quizParsed = QuizFileSchema.safeParse(quizRaw);
    if (quizParsed.success) {
      stats.quiz_questions = quizParsed.data.questions.length;
      for (const question of quizParsed.data.questions) {
        const referenced = [
          ...question.target_structure_ids,
          ...(question.accepted_structure_ids ?? []),
          ...(question.distractor_structure_ids ?? []),
        ];
        for (const structureId of referenced) {
          checkStructureRef(structureId, `quiz question "${question.id}"`, index.quiz_path);
        }
      }
    } else {
      errors.push({
        code: 'quiz_invalid',
        message: `quiz questions failed schema validation: ${describeZodError(quizParsed.error)}`,
        path: index.quiz_path,
      });
    }
  } catch (error) {
    errors.push({
      code: 'quiz_read_error',
      message: `cannot read quiz questions: ${describeError(error)}`,
      path: index.quiz_path,
    });
  }

  for (const violation of findPolicyViolations(manifests, opts.policy)) {
    errors.push({
      code: 'policy_violation',
      message: violation.message,
      bundle_id: violation.bundle_id,
    });
  }

  return { errors, warnings, stats };
}
