# Implementation status

Honest checklist as of 2026-08-09. "Verified" means an automated test or executed
command covers it, not that it was eyeballed once.

An adversarial multi-agent review pass (22 raw findings, 9 verified against the
code) ran before handoff; all confirmed defects were fixed with regression tests:

- Quiz start now clears selection/hover, and quiz question phase suppresses the
  selection/hover highlight entirely — a pre-quiz selection can no longer visually
  reveal an identify-on-model answer.
- `unloadBundle` during an in-flight load can no longer be overridden by that load
  (per-bundle generation counter; superseded loads dispose what they built and never
  publish; regression test with a gated fetch).
- GLB mesh nodes not covered by any manifest binding now fail the bundle in the
  registry AND fail `validate:anatomy-assets` (`unbound_mesh_node`) — geometry can
  never render outside the license/visibility gates.
- Quiz feedback is announced to screen readers (`role="status"`) and keyboard focus
  survives question→feedback→results transitions; the help dialog traps and
  restores focus.
- Fade slider drags cost one undo entry per gesture instead of flooding history;
  stale hover glow can no longer persist into quiz mode.

## Completed and verified

- Monorepo (pnpm): `@anatomy/core`, `@anatomy/viewer`, `@anatomy/ui`,
  `@anatomy/asset-tools`, `apps/web`; strict TS (`noUncheckedIndexedAccess`,
  `verbatimModuleSyntax`), ESLint flat + Prettier.
- Zod contracts for master index, bundle manifests, geometry bindings, ontology,
  education, lessons, quiz questions, license records (`packages/anatomy-core/src/schemas.ts`).
- Normalized anatomy index with duplicate/orphan/cycle detection and synthesized
  entries for bindings missing from the ontology.
- `AnatomyAssetRegistry`: data-driven bundle discovery, manifest validation before
  GLB fetch, streaming progress, optional SHA-256 verification, node↔binding mapping
  with hard rejection of mismatches, license-policy filtering before scene exposure,
  concurrency-capped lazy loading, unload with geometry/material/BVH disposal.
- Development fixture (2 bundles, 11 bindings, 13 structures incl. one multi-node
  structure, one 2-primitive node, one license-blocked node, one geometry-less
  structure) generated through the same ingestion path production assets will use.
- Explore vertical slice: orbit/pan/zoom, canonical A/P/L/R/S/I views, fit/reset,
  cancelable camera focus, real BVH mesh picking, grouped multi-node
  selection/highlight with exact material restore, hover tooltips (pointer devices
  only), hide/isolate/fade/x-ray/peel with undo/redo/reset, virtualized hierarchy,
  synonym-aware search with exact-before-fuzzy ranking and honest
  no-geometry results, structure details with education records + provenance badges,
  labels layer with budget, orientation gizmo per coordinate contract, dev
  diagnostics + perf overlay.
- Quiz vertical slice: declarative engine (grades by `structure_id`, never reveals
  answers pre-submission), identify-on-model via real canvas clicks +
  accessible answer list, multiple choice, feedback with fixture-sourced
  explanations, results + local history.
- Learn: one data-defined lesson route with step navigation + progress persistence.
  Saved: bookmarks/recents/quiz history behind `StudyRepository` (versioned key).
- Failure states: data load error w/ retry, bundle error toasts w/ retry, WebGL2
  missing, context loss overlay, fixture banner, ontology-only structures.
- Commands (all green as of this commit):
  - `pnpm typecheck` — 5/5 packages pass
  - `pnpm lint` — clean
  - `pnpm test` — 11 files, 79 tests pass (schemas, ontology, search, policy, quiz,
    storage, GLB round-trip, registry mapping incl. mismatch/license/unload,
    unload-during-load race, unbound-node rejection, visibility undo/redo +
    slider-gesture history, selection convergence, UI components)
  - `pnpm build` — passes (bundle ~1.34 MB minified / ~378 kB gzip; three.js dominates)
  - `pnpm validate:anatomy-assets` — 0 errors; `-- --policy external_preview` fails
    with exactly the deliberate `FIX-G-RESTRICTED` violation (exit 1)
  - `pnpm test:e2e` — 7/7 Playwright tests (Explore: search/canvas/hierarchy
    selection, isolate/reset/undo, honest missing geometry, progressive second
    bundle; Quiz: full identify-on-model session + accessible list path)

## Implemented but needs real assets

- Everything renders the marked development fixture. Production GLBs/manifests/
  ontology drop in via `VITE_ANATOMY_ASSET_BASE_URL` (see ASSET_CONTRACT.md); the
  code path is identical, but real-asset scale/perf is unproven.
- Education panel renders all record fields; only 6 synthetic records exist.
- TA2 crosswalk fields (`ta2_id`) are plumbed (schema, search, details) but the
  fixture has none.

## Blocked by missing/invalid inputs (anatomy-production gaps, not software gaps)

- Real canonical bundles, TA2 registry, relationship/educational databases, and the
  production control package were not provided to this environment.
- 0 departments are medically ready; collision/anatomical-review/completeness/
  licensing gates remain open upstream. Nothing here claims medical readiness.
- 40 license candidates remain blocked upstream; the policy layer is ready for the
  real ledger records.

## Intentionally deferred

- Draco/Meshopt/KTX2 decoders: loader hook exists at one call site
  (`GLTFLoader` construction in `registry.ts`); decoders not wired because the
  fixture is uncompressed. Add `DRACOLoader`/`KTX2Loader` there when real bundles use them.
- Label screen-space decluttering beyond the fixed budget (12) and data-driven
  landmark anchors.
- Quality tiers beyond dpr/antialias (shadow/effect toggles exist as settings only).
- Virtualized hierarchy uses a fixed-height viewport (340px) rather than measuring.
- Quiz session seed is fixed (42) for fixture-stage determinism — swap to random
  seed + persistence once real decks exist (`apps/web/src/state/quiz.ts`).
- Code-splitting of the three.js chunk (build warns >500 kB).
- WebGPU adapter, spaced repetition, instructor decks, account backend.

## Known bugs / measurements

- "Multiple instances of Three.js" warning appears in vitest for `apps/web` tests
  (pnpm resolution duplicates three between viewer/web in the test graph only; the
  production build contains a single copy). Cosmetic in tests.
- Fixture perf (headless swiftshader e2e): initial bundle ready < 2 s; effect apply
  pass < 1 ms at 11 meshes; pick latency ~1 ms. Real-asset numbers TBD.
- With `frameloop="demand"`, the FPS readout in the perf overlay reads 0 when idle —
  expected for render-on-demand.

## Exact next steps for Codex

1. **Wire compression decoders** (`packages/anatomy-viewer/src/registry.ts`): create
   the `GLTFLoader` via a small factory that attaches `DRACOLoader`/`KTX2Loader`/
   Meshopt when the manifest (add an `encodings` field) declares them; add a
   fixture bundle variant exercising it.
2. Then: point `VITE_ANATOMY_ASSET_BASE_URL` at the first real preliminary bundle
   (skeletal), run `pnpm validate:anatomy-assets -- --dir <mirror>`, and profile
   load/pick with the perf overlay; capture numbers here.
