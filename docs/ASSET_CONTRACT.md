# Asset contract

How anatomy data enters the app, and how to replace the development fixture with real
production bundles **without touching viewer code**.

## Directory layout (served under `VITE_ANATOMY_ASSET_BASE_URL`, default `/anatomy`)

```text
<base>/
  index.json                      # master index (MasterIndexSchema)
  contracts/
    coordinate_system_v1_1.json   # coordinate contract descriptor
  ontology/
    structures.json               # OntologyFileSchema — may contain structures WITHOUT geometry
  bundles/
    <bundle_id>/
      manifest.json               # BundleManifestSchema (bindings included)
      model.glb                   # canonical GLB bytes
  education/
    records.json                  # EducationFileSchema, keyed by structure_id
    lessons.json                  # LessonsFileSchema
    quiz-questions.json           # QuizFileSchema
```

The committed fixture lives at `apps/web/public/anatomy` (regenerate with
`pnpm generate:fixture`). **Real production GLBs must NOT be committed to this repo** —
serve them from a CDN or local mirror and point `VITE_ANATOMY_ASSET_BASE_URL` at it.

## Identities

- `structure_id` — permanent learnable-anatomy identity. All app state (selection,
  visibility, bookmarks, quiz answers) keys on it.
- `geometry_id` — unique rendered-geometry identity; multiple geometry bindings may
  share one `structure_id` (e.g. left arm upper + lower segments).
- Display names, synonyms and glTF node names are presentation/lookup data only.

## Coordinate space

`ANAT_CANONICAL_LSA_YUP_M_V1_1`, enforced by literal in every schema: right-handed
glTF space, meters, +X patient-left, +Y superior, +Z anterior, neutral adult
anatomical position, support-plane origin (Y=0, midsagittal X=0, Z=0 between heel
centers). Canonical release root transforms are identity with transforms baked into
vertices — the validator rejects any node carrying TRS/matrix, and the viewer never
applies runtime recentering/mirroring/scaling.

## Manifest → node mapping

Each binding carries `gltf_node: { index, name, mesh_index }`. At load the registry
resolves the node by **index** via the glTF parser associations, then cross-checks the
**name**. Any mismatch (missing index, name difference, node without mesh) puts the
bundle in `error` state with structured diagnostics — a mismatched GLB/manifest pair is
never silently rendered. A bundle update may change node indices freely as long as its
new manifest describes them; structure identities persist through `structure_id`.

## Replacing / adding a bundle (no viewer code changes)

1. Drop `bundles/<new_id>/model.glb` + `manifest.json` under the asset root.
2. Add the bundle entry to `index.json` (`bundle_id`, `system`, `manifest_path`,
   optional `initial: true` to load on startup).
3. Add/extend `ontology/structures.json` for any new structures (geometry-less entries
   are fine — search and details stay honest about missing geometry).
4. Run `pnpm validate:anatomy-assets -- --dir <asset-root>`.
5. Optionally add education records / quiz questions keyed by `structure_id`.

## License / release policy filtering

Every binding carries a `license` record (`status` + `allowed_policies`). Three
policies exist: `internal_development`, `external_preview`, `commercial_release`.

- **Build gate**: `pnpm validate:anatomy-assets -- --policy external_preview` (or
  `commercial_release`) FAILS if any blocked/pending binding is present in the bundle
  set — blocked bytes must not ship in external builds at all.
- **Runtime gate** (defense in depth): the registry removes nodes whose license does
  not clear the configured `VITE_ANATOMY_RELEASE_POLICY` before the scene ever sees
  them, and the UI reports the exclusion honestly.
- QA status is never treated as license approval; both are displayed separately in
  developer diagnostics.

## Validation command

`pnpm validate:anatomy-assets [-- --dir <path>] [-- --policy <policy>]` checks:
schema validity of every file, coordinate contract ID, unique `geometry_id`s (within
and across bundles), stable-ID formatting, laterality/sex/life-stage enums, manifest ↔
GLB node consistency (index/name/mesh), identity node transforms, SHA-256 of local GLB
bytes vs manifests, hierarchy cycles/orphans, education/lesson/quiz references to
unknown structures, and release-policy violations. Exit 1 on any error, with
bundle/path/expected/actual detail per finding.

## Verified hashes in the browser

Set `VITE_ANATOMY_VERIFY_HASHES=1` to SHA-256-check every GLB before parsing
(dev/QA workflow; off by default so normal rendering never blocks on hashing).
