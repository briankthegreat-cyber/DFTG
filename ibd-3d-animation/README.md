# Inside the Gut: Understanding IBD (3D explainer)

An interactive 3D animation for the **Don't Fret The Gut** website that walks patients through
inflammatory bowel disease in six short chapters: a healthy gut, what IBD is, Crohn's disease,
ulcerative colitis, flares and remission, and next steps.

It is built the same way as the Beverly Hills Health website workspace: **Vite + React 19 +
TypeScript + Tailwind CSS v4**, with **React Bits** components vendored under `src/react-bits/`
and **react-three-fiber** (Three.js) for the 3D scene. Everything compiles to a single HTML file
in `site/index.html` that can be hosted anywhere and embedded in the site builder with an iframe.

## What the animation shows

| Chapter | What happens on screen |
| --- | --- |
| 1. A healthy gut | Front view of the stomach, small intestine and colon. Gentle peristalsis waves, calm pink lining, labels for each organ. |
| 2. What is IBD? | Camera pushes in; glowing immune-cell motes gather around the bowel. Copy explains IBD is an immune condition, not IBS, and not the patient's fault. |
| 3. Crohn's disease | Patchy red "skip lesions" appear, most strongly at the terminal ileum, with healthy bowel between. Walls thicken, creeping fat appears on one side, and the inset shows inflammation through the full wall with a narrowed channel. The rectum stays spared. |
| 4. Ulcerative colitis | A continuous red front starts at the rectum and climbs the colon. Ulcers pit the lining and the haustra flatten. Stage labels appear as the front passes proctitis, left-sided and extensive colitis. The inset shows only the inner lining involved. |
| 5. Flares and remission | The inflamed colon pulses (flare), then calms and returns toward healthy pink (remission). Both directions are shown as reversible. |
| 6. Don't fret the gut | Calm overview with a plain-language call to action and the booking button. |

The bowel-wall inset (bottom right) is a cross-section with four layers: inner lining (mucosa),
submucosa, muscle layers and outer coat (serosa). It morphs between healthy, ulcerative colitis
and Crohn's shapes.

All patient-facing text lives in **`src/ibd/content.ts`**. Edit copy there; nothing else needs
to change. The file has a "Reviewed by / Last reviewed" line at the top for clinician sign-off.

> The animation is general education. It is not a diagnostic tool and says so in the built-in
> disclaimer (info button, top right). Dr. Katiraie should review the copy in `content.ts` before
> it goes live.

## Running it on your computer

1. Install [Node.js](https://nodejs.org) 20 or newer.
2. In this folder:

```bash
npm install
npm run dev
```

3. Open the address it prints (usually http://localhost:5174).

Other commands:

```bash
npm run build          # production build into dist/
npm run build:single   # one self-contained file -> site/index.html (this is what gets hosted)
npm run typecheck      # TypeScript check
npm test               # unit tests (anatomy, condition model, timeline, copy)
npm run test:e2e       # Playwright browser tests (WebGL renders, chapters switch, controls work)
npm run screenshots    # one still per chapter into shots/
npm run video          # render the whole tour to media/ibd-animation.mp4 (needs ffmpeg)
```

## Putting it on the Don't Fret The Gut website

The website itself is hosted on a no-code builder, so the animation is hosted separately and
embedded.

### 1. Host the single file

The committed file `site/index.html` is the whole app (about 1.4 MB, no external scripts).
Easiest option: GitHub Pages from this repository.

1. On GitHub open **Settings -> Pages**.
2. Under **Build and deployment** choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. After a minute the animation is live at
   `https://briankthegreat-cyber.github.io/DFTG/ibd-3d-animation/site/`.

Any static host works too (Netlify, Vercel, Cloudflare Pages, or the clinic's own web host).
Upload `site/index.html` and optionally `site/poster.jpg` and `site/ibd-animation.mp4` next to it.

### 2. Embed it

In the site builder add an **Embed / Custom HTML** block and paste:

```html
<iframe
  src="https://briankthegreat-cyber.github.io/DFTG/ibd-3d-animation/site/"
  title="Inside the gut: an interactive 3D explainer of inflammatory bowel disease"
  style="width:100%;aspect-ratio:16/10;border:0;border-radius:16px;overflow:hidden"
  loading="lazy"
  allow="fullscreen"
  allowfullscreen
  referrerpolicy="no-referrer"
></iframe>
```

Notes:

- Keep the `aspect-ratio` so the frame has a height; iframes have none of their own.
- If the builder only allows a link, link to the hosted URL and use the video below on the page.
- If the builder adds a `sandbox` attribute, it must include `allow-scripts`.

### 3. Video fallback

`media/ibd-animation.mp4` is the full tour rendered as a video (1280x720). Upload it as a normal
video block anywhere an iframe is not possible (social posts, the builder's video block, email).
The same file, copied to `site/ibd-animation.mp4`, plays automatically inside the app for the rare
browser without WebGL.

## Options (URL parameters)

Add these to the iframe `src`:

| Parameter | Effect |
| --- | --- |
| `?theme=light` | Light stage instead of the dark teal one |
| `?chapter=uc` | Start at a chapter: `healthy`, `ibd`, `crohns`, `uc`, `flares`, `next` |
| `?autoplay=0` | Start paused |
| `?loop=1` | Loop the tour |
| `?inset=0` | Hide the bowel-wall inset |
| `?ui=0` | Hide all controls and text (3D only) |
| `?quality=low` | Force the lighter render path (no bloom or shadows) |
| `?book=https://...` | Booking link for the "Book a visit" button (https only) |

Example: `.../site/?theme=light&chapter=crohns`

## How it behaves

- **Autoplays a 70-second guided tour**, with play/pause, chapter pills, a seekable progress bar,
  keyboard control (space, left/right arrows) and full screen.
- **Pause to explore**: while paused, drag to orbit around the current view. While playing, the
  mouse adds a gentle parallax only.
- **Reduce motion**: honours the operating-system setting and has a manual toggle. Peristalsis,
  particles, camera glides and text animations are switched off; content still changes.
- **Pauses itself** when the tab is hidden or the embed scrolls out of view.
- **Performance**: picks a lighter render path on phones and low-power devices; caps pixel
  ratio at 2; falls back to the video if WebGL is unavailable or the context is lost twice.
- **Privacy**: no analytics, no tracking, no calls to third parties other than Google Fonts for
  the two typefaces (remove the `<link>` in `index.html` to use system fonts only).

## Project layout

```
ibd-3d-animation/
  index.html                 Vite entry (fonts, meta)
  src/main.tsx, App.tsx      React bootstrap, options, fallbacks, visibility handling
  src/index.css              Tailwind + design tokens (colors, fonts, glass panels, labels)
  src/ibd/                   Framework-free model, unit tested
    anatomy-paths.ts         Curve control points for stomach, small intestine, colon; landmarks
    conditions.ts            Crohn's lesion set, UC extent model, inflammation math
    timeline.ts              Chapters, condition curves, camera keyframes -> stateAt(time)
    content.ts               ALL patient-facing copy, labels, disclaimer, sources
    tube-geometry.ts         Variable-radius tube builder with shader attributes
    tissue-material.ts       MeshPhysicalMaterial + injected GLSL (shaders/tissue-shader.ts)
    camera-rig.ts            Damped camera follow + user orbit
    immune-particles.ts      Glowing immune-cell motes
    cross-section-model.ts   Bowel-wall inset with morphing layers
    label-overlay.ts         Screen-space labels with leader lines and occlusion
  src/scene/                 react-three-fiber components (canvas, lights, effects, capture API)
  src/ui/                    React UI (chapter card, nav, controls, inset panel, disclaimer)
  src/react-bits/            Vendored React Bits components used by the UI (see its README)
  src/store/player.ts        Playback state store
  scripts/                   make-preview (single file), screenshots, render-video
  test/unit, test/e2e        node:test unit tests, Playwright browser tests
  site/index.html            The built single file to host
  media/                     Rendered video
```

## Medical accuracy notes

- Anatomy is stylised but ordered correctly and shown from the front (patient's left on the
  viewer's right). The transverse colon and duodenum sit in their usual planes.
- Crohn's: skip lesions, terminal ileum emphasis, transmural involvement, wall thickening,
  creeping fat, rectal sparing, mouth-to-anus wording. Cobblestoning is a luminal finding and is
  not drawn on the outer surface.
- Ulcerative colitis: rectum-first, continuous, colon-only, inner-lining depth, ulcers, loss of
  haustra with longstanding disease, extent stages (proctitis, left-sided, extensive).
- Flare and remission are shown as reversible; no chapter implies inevitable worsening.
- Copy states that IBD is not IBS and not caused by stress or the patient's behaviour.
- Sources listed in the info panel: Crohn's & Colitis Foundation, ACG, NIDDK.
