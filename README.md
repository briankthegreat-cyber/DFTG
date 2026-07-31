# EMBERLINE: Caravan of the Last Dawn

A portrait-first strategy game vertical slice built from the EMBERLINE design
document and master build specification.

## Play loop

Begin Journey opens mission 1 directly into the first placement action:

1. Forge and place crew Echoes on the 5×7 hex board.
2. Watch the crew discover, gather, carry, and activate the Work contract.
3. Defend the same board during automatic Nightfall combat.
4. Collect the Camp reward and prepare the next round.
5. Complete missions to open the 28-node campaign road and Lantern Workshop.

Campaign, Crew, Workshop, Collection, settings, pack-reveal recovery, and
versioned local progress are connected in the same interface. Mouse, keyboard,
touch, reduced motion, and high-contrast presentation are supported.

## 3D battlefield

The board is rendered by a live three.js miniature layer
(`app/BattlefieldMiniatures3D.tsx` + `app/battle3d/`):

- Eight bespoke articulated hero rigs (tesla staff, living lantern-shield,
  bird courier, bell-hammer, ink wisp, pot-stack chef, prism bow, rail golem)
  with idle flourishes, walk cycles, attack wind-ups, and target facing.
- Eight distinct Duskborn monster models, each with its own locomotion:
  hovering motes, flapping glarewings, stomping hollow knights, gliding
  whisperers, scuttling mimic masks, brick-hauling masons, slithering
  parcel leeches, and hopping bell husks.
- Full lifecycle staging: rift spawn portals, hit flashes with recoil,
  death dissolves with particle bursts, and escape fade-outs.
- Per-hero attack effects: chain lightning, prism arrows, ricochet darts,
  mark runes, lobbed fire flasks, traveling hammer shockwaves, root snares,
  and rail charges — plus merge celebration bursts, orbiting star gems,
  work-phase hammer sparks, and ambient fireflies.
- A single pooled additive particle system keeps everything mobile-friendly.

## Centralized tuning

Authoritative campaign, character, reward, merge, Hearth Pack odds, guarantee,
relic, and duplicate-conversion values live in `app/game-core.ts`.

The supplied concept art is used from `public/emberline-assets/`.

## Local development

Requires Node.js 22.13+.

```bash
pnpm install
pnpm run dev
pnpm test
```

`pnpm run build` creates the Cloudflare Worker-compatible production output.

## Scope

The build implements the complete navigable vertical slice and data-complete
28-mission campaign. Mission 1 contains the authored onboarding and full phase
loop. Later missions currently reuse the launch board simulation with their
mission-specific contract, round count, lesson, reward, and boss metadata;
their bespoke contract simulations, boss behaviors, final audio, and production
character animation remain the next content-production phase.
