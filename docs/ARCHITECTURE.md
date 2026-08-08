# Architecture

Anatomy App is a pnpm workspace. Every boundary exists so that anatomy data can keep
improving (new GLBs, corrected manifests, expanded ontology) without refactoring the
product, and so another engineer can pick up any layer independently.

```text
apps/
  web/                 # product shell: routes/modes, panels, pages, e2e tests
packages/
  anatomy-core/        # contracts: zod schemas, IDs, ontology index, search, policy,
                       # quiz engine, study-data repositories. No React, no Three.js.
  anatomy-viewer/      # Three.js/R3F: asset registry, scene cache, picking, camera,
                       # reversible material effects, viewer-domain zustand stores.
  anatomy-ui/          # presentational React components (Panel, VirtualList, …) + styles.css
  anatomy-asset-tools/ # node CLIs: GLB writer/reader, fixture generator, asset validator
docs/                  # this file, ASSET_CONTRACT.md, IMPLEMENTATION_STATUS.md
```

Dependency direction: `web → viewer/ui/core`, `viewer → core`, `asset-tools → core`.
`anatomy-core` never imports React or Three.js — it is the single source of truth for
data shapes and pure logic, unit-testable in isolation.

## Data flow

```text
index.json ─▶ AnatomyAssetRegistry.loadMasterIndex()          (zod-validated)
   │                    │
   │   ontology / education / lessons / quiz JSON              (zod-validated)
   │                    ▼
   └─▶ all bundle manifests (small JSON, loaded eagerly)
                        ▼
        buildAnatomyIndex() ─▶ normalized ID-keyed maps + ingestion issues
                        ▼
        buildSearchDocs() ─▶ AnatomySearch (exact tiers before fuzzy)

user action (Explore) ─▶ registry.requestBundle(bundleId)      (lazy, concurrency-capped)
                        ▼
        fetch GLB (progress) ─▶ optional SHA-256 ─▶ GLTFLoader.parse
                        ▼
        mapBindings(): glTF node index/name/mesh ⇄ GeometryBinding
          · mismatch ⇒ bundle state 'error', nothing rendered
          · license-blocked under policy ⇒ node removed before exposure
                        ▼
        sceneCache (Three objects OUTSIDE React state) ─▶ <BundleGroups/> mounts groups
```

## State domains (all keyed by stable IDs, never scene objects)

| Store | Package | Contents |
| --- | --- | --- |
| `useDataStore` | web | master index, AnatomyIndex, education map, lessons, quiz pool, search |
| `useRegistryStore` | viewer | per-bundle `notRequested→queued→loadingManifest→loadingGeometry→ready/error/disposed` snapshots |
| `useSelectionStore` | viewer | selected/hovered `structure_id` + selection source |
| `useVisibilityStore` | viewer | hidden systems/structures, isolation set, fade, x-ray + undo/redo snapshots |
| `useCameraStore` | viewer | tokenized camera requests (focus / canonical view / fit / reset) |
| `useAppStore` / `useUiStore` | web | mode (hash-synced), settings, panel/dialog state, label set |
| `useQuizStore` | web | wraps the pure quiz engine from core; grading by `structure_id` |
| `useStudyStore` | web | bookmarks/recents/quiz history via `StudyRepository` (localStorage behind an interface) |

`sceneCache` (viewer) is deliberately **not** a React store: it maps
`bundleId → { group, meshesByGeometryId, geometryIdsByStructureId }` and notifies
subscribers by version. React components read it with `useSyncExternalStore`.

## Viewer/React separation

- `AnatomyCanvas` renders on demand (`frameloop="demand"`); every state change that
  affects pixels calls `invalidate()` exactly once (see `EffectsController`).
- `EffectsController` is the single writer of visual state: it projects
  selection + visibility + fade/x-ray onto meshes via `applyEffectState`, which
  lazily clones materials and can always restore the exact original.
- Picking uses real mesh raycasts (three-mesh-bvh accelerated). Non-selectable or
  hidden meshes get a no-op `raycast` so they can never intercept rays.
- `CameraRig` consumes tokenized requests; user input cancels transitions;
  reduced motion makes them instant.
- The single write-path for selection is `controller.selectStructure(id, via)` —
  canvas, search, hierarchy, labels, lessons and quiz all converge there.

## Quiz engine

`@anatomy/core/quiz.ts` is pure data-in/data-out: `createQuizSession` (filters to
available structure IDs so identify-on-model is always answerable),
`getPublicQuestion` (never exposes target IDs pre-submission), `submitAnswer`
(grades by `structure_id`), `advance`, `summarize`. The web quiz store adds camera
focus/highlight of the correct answer and history persistence.

## Extension points

- **New bundle/system**: add data files; zero viewer code (see ASSET_CONTRACT.md).
- **WebGPU later**: renderer specifics live inside `AnatomyCanvas`; the rest of the
  viewer talks to stores and `sceneCache` only.
- **Account backend later**: implement `StudyRepository` against an API and swap it
  in `apps/web/src/state/study.ts`.
- **Instructor decks / spaced repetition**: extend `QuizFileSchema` + engine; UI
  consumes `PublicQuizQuestion` unchanged.
