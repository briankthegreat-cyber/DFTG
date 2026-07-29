# Cosmic Drift: Eat the Universe

A complete momentum-based browser arcade game built with Vinext, React,
TypeScript, and HTML5 Canvas.

## Play

```bash
pnpm install
pnpm run dev
```

Open the local URL printed by the development server.

- Steer with WASD, arrow keys, a gamepad stick, or the touch joystick.
- Absorb bodies with a broken green orbit.
- Avoid bodies with spiked magenta signals.
- Similar-size gold-ringed bodies cause a glancing deflection.
- Catch Prism Comets for major power-ups.
- Reach Singularity to finish the standard run and unlock Endless Mode.

## Verify

```bash
pnpm run test:logic
pnpm run lint
pnpm test
```

Add `?debug=1` to the URL to expose the development-only Drift Lab controls.
