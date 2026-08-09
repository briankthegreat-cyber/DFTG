import { describe, expect, it } from 'vitest';
import { COORDINATE_SYSTEM_ID } from './ids';
import {
  BundleManifestSchema,
  EducationalRecordSchema,
  MasterIndexSchema,
  type EducationalRecord,
} from './schemas';
import { makeBinding, makeManifest } from './testing';

describe('BundleManifestSchema', () => {
  it('parses the development fixture manifest from makeManifest()', () => {
    const parsed = BundleManifestSchema.parse(makeManifest());
    expect(parsed.bundle_id).toBe('test-bundle');
    expect(parsed.coordinate_system_id).toBe(COORDINATE_SYSTEM_ID);
    expect(parsed.bindings).toHaveLength(1);
  });

  it('accepts supported optional asset encodings', () => {
    const parsed = BundleManifestSchema.parse(
      makeManifest({ encodings: ['draco', 'meshopt', 'ktx2'] }),
    );
    expect(parsed.encodings).toEqual(['draco', 'meshopt', 'ktx2']);
  });

  it('rejects unknown asset encodings', () => {
    const bad = { ...makeManifest(), encodings: ['zip'] };
    expect(BundleManifestSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects any coordinate_system_id other than the canonical one', () => {
    const bad = { ...makeManifest(), coordinate_system_id: 'ANAT_SOME_OTHER_SYSTEM_V9' };
    const result = BundleManifestSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects a manifest whose binding uses a non-canonical coordinate system', () => {
    const bad = {
      ...makeManifest(),
      bindings: [{ ...makeBinding(), coordinate_system_id: 'ANAT_SOME_OTHER_SYSTEM_V9' }],
    };
    expect(BundleManifestSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects two bindings with the same geometry_id in one manifest', () => {
    const manifest = makeManifest({
      bindings: [
        makeBinding({ geometry_id: 'TEST-G-DUP', structure_id: 'TEST-S-A' }),
        makeBinding({ geometry_id: 'TEST-G-DUP', structure_id: 'TEST-S-B' }),
      ],
    });
    const result = BundleManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
    if (result.success) throw new Error('expected duplicate geometry_id to fail');
    const issue = result.error.issues.find((i) => /duplicate geometry_id/.test(i.message));
    expect(issue).toBeDefined();
    expect(issue?.path).toEqual(['bindings']);
  });

  it('rejects an invalid laterality value', () => {
    const bad = {
      ...makeManifest(),
      bindings: [{ ...makeBinding(), laterality: 'sideways' }],
    };
    expect(BundleManifestSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a too-short structure_id', () => {
    const manifest = makeManifest({ bindings: [makeBinding({ structure_id: 'ab' })] });
    expect(BundleManifestSchema.safeParse(manifest).success).toBe(false);
  });

  it('rejects a structure_id with illegal characters', () => {
    const manifest = makeManifest({ bindings: [makeBinding({ structure_id: 'bad id!' })] });
    expect(BundleManifestSchema.safeParse(manifest).success).toBe(false);
  });

  it('rejects a malformed asset_sha256', () => {
    const shortHash = makeManifest({ bindings: [makeBinding({ asset_sha256: 'deadbeef' })] });
    expect(BundleManifestSchema.safeParse(shortHash).success).toBe(false);

    const uppercase = makeManifest({
      bindings: [makeBinding({ asset_sha256: 'A'.repeat(64) })],
    });
    expect(BundleManifestSchema.safeParse(uppercase).success).toBe(false);

    const valid = makeManifest({ bindings: [makeBinding({ asset_sha256: 'a1'.repeat(32) })] });
    expect(BundleManifestSchema.safeParse(valid).success).toBe(true);
  });
});

describe('MasterIndexSchema', () => {
  const validIndex = {
    schema_version: '1.0.0',
    generated_at: '2026-01-01T00:00:00Z',
    coordinate_system_id: COORDINATE_SYSTEM_ID,
    release_stage: 'development_fixture',
    ontology_path: 'ontology.json',
    education_path: 'education.json',
    lessons_path: 'lessons.json',
    quiz_path: 'quiz.json',
    bundles: [
      {
        bundle_id: 'test-bundle',
        system: 'test_system',
        display_name: 'Test Bundle',
        manifest_path: 'bundles/test-bundle.manifest.json',
      },
    ],
  };

  it('accepts a valid master index and applies bundle defaults', () => {
    const result = MasterIndexSchema.safeParse(validIndex);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('expected valid master index to parse');
    expect(result.data.bundles[0]?.development_fixture).toBe(false);
    expect(result.data.bundles[0]?.initial).toBe(false);
  });

  it('rejects a release_stage typo', () => {
    const typo = { ...validIndex, release_stage: 'developmnt_fixture' };
    expect(MasterIndexSchema.safeParse(typo).success).toBe(false);
    const wrongStage = { ...validIndex, release_stage: 'prod' };
    expect(MasterIndexSchema.safeParse(wrongStage).success).toBe(false);
  });
});

describe('EducationalRecordSchema', () => {
  const validRecord: EducationalRecord = {
    structure_id: 'TEST-S-A',
    title: 'Test Structure A',
    citations: [{ label: 'Development fixture', kind: 'development_fixture' }],
    reviewed_status: 'draft',
    content_version: '1.0.0',
    development_fixture: true,
  };

  it('accepts a record with citations and reviewed_status', () => {
    expect(EducationalRecordSchema.safeParse(validRecord).success).toBe(true);
  });

  it('requires citations', () => {
    const { citations: _citations, ...withoutCitations } = validRecord;
    expect(EducationalRecordSchema.safeParse(withoutCitations).success).toBe(false);
  });

  it('requires reviewed_status and rejects unknown values', () => {
    const { reviewed_status: _status, ...withoutStatus } = validRecord;
    expect(EducationalRecordSchema.safeParse(withoutStatus).success).toBe(false);
    const badStatus = { ...validRecord, reviewed_status: 'signed_off' };
    expect(EducationalRecordSchema.safeParse(badStatus).success).toBe(false);
  });
});
