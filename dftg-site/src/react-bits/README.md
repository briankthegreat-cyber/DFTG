# React Bits (vendored subset)

The components in this folder are copied from the **TypeScript + Tailwind** variant of
[React Bits](https://reactbits.dev) by David Haz (https://github.com/DavidHDev/react-bits,
commit `65305ea`), the same source used by the Beverly Hills Health website workspace.
Only the components this explainer uses are included:

- `TextAnimations/SplitText` – GSAP-driven headline reveal (chapter titles)
- `TextAnimations/BlurText` – word-by-word blur-in (chapter body copy)
- `TextAnimations/ShinyText` – subtle sheen on the brand kicker
- `Animations/FadeContent` – staggered fade/blur-in for fact chips
- `Animations/StarBorder` – animated border for the call-to-action button
- `Animations/Magnet` – gentle magnetic hover on the play button
- `Components/SpotlightCard` – pointer-following spotlight on the chapter card

`LICENSE.md` is MIT + Commons Clause: using these inside our own websites (including
commercial sites) is allowed; reselling or redistributing the components as a library is not.

Import with the `@react-bits` alias, for example:

```tsx
import SplitText from '@react-bits/TextAnimations/SplitText/SplitText';
```

To refresh, re-copy the same files from a fresh clone of the upstream repo.
