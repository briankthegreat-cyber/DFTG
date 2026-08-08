import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BundleManifestSchema,
  COORDINATE_SYSTEM_ID,
  EducationFileSchema,
  LessonsFileSchema,
  MasterIndexSchema,
  OntologyFileSchema,
  QuizFileSchema,
} from '@anatomy/core';
import { buildGlbBytes } from '../glb';
import {
  COORDINATE_CONTRACT_PATH,
  COORDINATE_CONTRACT_V1_1,
  FIXTURE_BUNDLES,
  FIXTURE_EDUCATION_RECORDS,
  FIXTURE_GENERATED_AT,
  FIXTURE_INDEX_METADATA,
  FIXTURE_LESSON,
  FIXTURE_QUIZ_QUESTIONS,
  FIXTURE_SCHEMA_VERSION,
  FIXTURE_STRUCTURES,
  buildFixtureBundleManifest,
  buildFixtureGlbSpec,
} from '../fixture-def';

interface JsonSchemaLike {
  safeParse(data: unknown): { success: true } | { success: false; error: { message: string } };
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..', '..', '..');

function resolveOutDir(argv: string[]): string {
  const args = argv.filter((a) => a !== '--');
  const flagIndex = args.indexOf('--out');
  if (flagIndex === -1) {
    return path.join(repoRoot, 'apps', 'web', 'public', 'anatomy');
  }
  const value = args[flagIndex + 1];
  if (value === undefined) {
    throw new Error('--out requires a directory argument');
  }
  return path.resolve(value);
}

async function writeJson(
  outDir: string,
  relPath: string,
  data: unknown,
  schema?: JsonSchemaLike,
): Promise<void> {
  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(`refusing to write invalid ${relPath}: ${result.error.message}`);
    }
  }
  const filePath = path.join(outDir, relPath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`wrote ${relPath}`);
}

async function writeBytes(outDir: string, relPath: string, bytes: Uint8Array): Promise<void> {
  const filePath = path.join(outDir, relPath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes);
  console.log(`wrote ${relPath} (${bytes.byteLength} bytes)`);
}

async function main(): Promise<void> {
  const outDir = resolveOutDir(process.argv.slice(2));
  console.log(`generating development fixture into ${outDir}`);

  const indexBundles = [];
  for (const bundleDef of FIXTURE_BUNDLES) {
    const glbBytes = buildGlbBytes(buildFixtureGlbSpec(bundleDef));
    const sha256 = createHash('sha256').update(glbBytes).digest('hex');
    const base = buildFixtureBundleManifest(bundleDef);
    const manifest = {
      ...base,
      asset_sha256: sha256,
      asset_byte_length: glbBytes.byteLength,
      bindings: base.bindings.map((binding) => ({ ...binding, asset_sha256: sha256 })),
    };
    const bundleDir = path.join('bundles', bundleDef.bundle_id);
    await writeJson(outDir, path.join(bundleDir, 'manifest.json'), manifest, BundleManifestSchema);
    await writeBytes(outDir, path.join(bundleDir, 'model.glb'), glbBytes);
    indexBundles.push({
      bundle_id: bundleDef.bundle_id,
      system: bundleDef.system,
      display_name: bundleDef.display_name,
      manifest_path: `bundles/${bundleDef.bundle_id}/manifest.json`,
      development_fixture: true,
      approx_byte_length: glbBytes.byteLength,
      initial: bundleDef.initial,
    });
  }

  const index = {
    schema_version: FIXTURE_INDEX_METADATA.schema_version,
    generated_at: FIXTURE_GENERATED_AT,
    coordinate_system_id: COORDINATE_SYSTEM_ID,
    release_stage: FIXTURE_INDEX_METADATA.release_stage,
    ontology_path: FIXTURE_INDEX_METADATA.ontology_path,
    education_path: FIXTURE_INDEX_METADATA.education_path,
    lessons_path: FIXTURE_INDEX_METADATA.lessons_path,
    quiz_path: FIXTURE_INDEX_METADATA.quiz_path,
    bundles: indexBundles,
  };
  await writeJson(outDir, 'index.json', index, MasterIndexSchema);

  await writeJson(outDir, COORDINATE_CONTRACT_PATH, COORDINATE_CONTRACT_V1_1);

  await writeJson(
    outDir,
    FIXTURE_INDEX_METADATA.ontology_path,
    { schema_version: FIXTURE_SCHEMA_VERSION, structures: FIXTURE_STRUCTURES },
    OntologyFileSchema,
  );
  await writeJson(
    outDir,
    FIXTURE_INDEX_METADATA.education_path,
    { schema_version: FIXTURE_SCHEMA_VERSION, records: FIXTURE_EDUCATION_RECORDS },
    EducationFileSchema,
  );
  await writeJson(
    outDir,
    FIXTURE_INDEX_METADATA.lessons_path,
    { schema_version: FIXTURE_SCHEMA_VERSION, lessons: [FIXTURE_LESSON] },
    LessonsFileSchema,
  );
  await writeJson(
    outDir,
    FIXTURE_INDEX_METADATA.quiz_path,
    { schema_version: FIXTURE_SCHEMA_VERSION, questions: FIXTURE_QUIZ_QUESTIONS },
    QuizFileSchema,
  );

  console.log('fixture generation complete');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
