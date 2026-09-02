# React Bits (vendored)

This folder is a copy of the **TypeScript + Tailwind** variant of every component from
[React Bits](https://reactbits.dev) by David Haz, taken from
https://github.com/DavidHDev/react-bits at commit `65305ea`.

- `Animations/`, `Backgrounds/`, `Components/`, `TextAnimations/` — one folder per component.
- `COMPONENTS.md` — the upstream index of every component with a one-line description.
- `LICENSE.md` — MIT + Commons Clause. Using these components inside our own websites
  (including commercial sites) is allowed. Reselling or redistributing the components
  themselves as a library is not.

Import a component with the `@react-bits` alias, for example:

```tsx
import Aurora from '@react-bits/Backgrounds/Aurora/Aurora';
import SplitText from '@react-bits/TextAnimations/SplitText/SplitText';
```

To refresh from upstream, re-copy `src/ts-tailwind/*` from a fresh clone of the repo above
and update the commit hash here.
