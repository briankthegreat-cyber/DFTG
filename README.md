# Anatomy App

A medically structured, interactive 3D human anatomy learning application:
manifest-driven 3D atlas (Explore), guided lessons (Learn), identify-on-model
quizzes (Quiz), and local-first study data (Saved).

> **Development fixture notice** — this repository currently ships a tiny synthetic
> geometric fixture (clearly marked `development_fixture` in every file and bannered
> in the UI). It exists to exercise the exact production ingestion path. It is not
> human anatomy and contains no medical content.

## Getting started

Requirements: Node ≥ 20, pnpm 10 (`corepack enable`).

```bash
pnpm install
pnpm dev              # http://localhost:5173
```

Optional configuration: copy `.env.example` to `apps/web/.env` — asset base URL,
release policy (`internal_development` | `external_preview` | `commercial_release`),
and browser-side GLB hash verification.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server for `apps/web` |
| `pnpm build` | Production build |
| `pnpm preview` | Serve the production build (port 4173) |
| `pnpm typecheck` | Strict `tsc --noEmit` in every package |
| `pnpm lint` | ESLint (flat config) across the workspace |
| `pnpm test` | Vitest unit/component suites (all packages) |
| `pnpm test:e2e` | Playwright end-to-end (builds + serves automatically) |
| `pnpm validate:anatomy-assets` | Validate the asset tree (add `-- --policy external_preview` to run the release/license gate) |
| `pnpm generate:fixture` | Regenerate the committed development fixture deterministically |

## Repository map

- `apps/web` — application shell, pages, app-level state, Playwright e2e
- `packages/anatomy-core` — schemas/contracts, ontology index, search, policy,
  quiz engine, storage repositories (no React/Three)
- `packages/anatomy-viewer` — Three.js/R3F viewer: asset registry, picking,
  camera, reversible visibility/material effects
- `packages/anatomy-ui` — reusable presentational components + `styles.css`
- `packages/anatomy-asset-tools` — GLB writer/reader, fixture generator, asset validator
- `docs/` — [ARCHITECTURE](docs/ARCHITECTURE.md) ·
  [ASSET_CONTRACT](docs/ASSET_CONTRACT.md) ·
  [IMPLEMENTATION_STATUS](docs/IMPLEMENTATION_STATUS.md)

## Using real anatomy assets

Serve a production asset tree (index.json, bundle manifests + GLBs, ontology,
education) from any static host and set `VITE_ANATOMY_ASSET_BASE_URL`. No viewer
code changes are required — see [docs/ASSET_CONTRACT.md](docs/ASSET_CONTRACT.md)
for the layout, ID rules, coordinate contract, and the license/release gates.
Do not commit production GLBs to this repository.
