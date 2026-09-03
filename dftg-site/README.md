# Don’t Fret the Gut website

The website for the **Don’t Fret the Gut Foundation**, a non-profit education and community
project about IBD and IBS, plus **Inside the Gut**, an interactive 3D explainer of inflammatory
bowel disease that lives on the Understand IBD page and can also be embedded anywhere on its own.

Built the same way as the Beverly Hills Health website workspace: **Vite + React 19 + TypeScript +
Tailwind CSS v4**, **React Router**, vendored **React Bits** components for motion, and
**react-three-fiber** (Three.js) for the 3D scene.

## What is in the site

| Route | Page |
| --- | --- |
| `/` | Home: hero with a live 3D healthy gut in the arch, ticker, Learn (IBD and IBS cards, comparison table), resources, 3D explainer teaser, community stories, get involved, donate, shop preview, newsletter |
| `/learn` | Learn hub: condition cards, comparison table, explainer teaser, the three guides in full |
| `/learn/ibd` | Understand IBD: the full 3D explainer plus a plain-language written guide, FAQ, and sources |
| `/learn/ibs` | Understand IBS: written guide, comparison, FAQ, and sources |
| `/community` | Stories and a "share your story" section |
| `/get-involved` | Donate, volunteer, partner, fundraise |
| `/shop` | The core collection, proceeds pledge, FAQ |
| `/embed.html` | The 3D explainer alone (for iframes and social posts) |

Everything a visitor reads lives in two files:

- **`src/site/data.ts`**: all website copy (hero, cards, guides, stories, shop, FAQ, footer, the IBD and IBS guides).
- **`src/ibd/content.ts`**: the copy inside the 3D explainer (chapters, labels, disclaimer, sources) and the clinician `REVIEW` block.

Edit words there; nothing else needs to change.

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
npm run build           # production build of the site and the embed into dist/
npm run build:embed     # single self-contained file for the explainer -> embed/index.html (committed)
npm run build:preview   # single-file preview of the whole site -> preview/dftg-site.html
npm run typecheck       # TypeScript check
npm test                # unit tests (anatomy layout, condition model, timeline, copy rules)
npm run test:e2e        # Playwright: site pages, navigation, bag and donate widgets, WebGL explainer
npm run screenshots     # stills of each explainer chapter
npm run screenshots:site# stills of every site route at desktop and phone widths
npm run video           # render the explainer tour to embed/ibd-animation.mp4 (needs ffmpeg)
```

## Publishing

### The whole site (GitHub Pages)

A workflow at `.github/workflows/pages.yml` builds the site and deploys it on every push to `main`.
One-time setup: repository **Settings -> Pages -> Source: GitHub Actions**. The site then lives at
`https://briankthegreat-cyber.github.io/DFTG/` and the explainer at
`https://briankthegreat-cyber.github.io/DFTG/embed.html`.

To use a custom domain later (for example `dontfretthegut.org`), add it under Settings -> Pages and
set `VITE_BASE=/` in the workflow. Netlify, Vercel, or Cloudflare Pages also work: build command
`npm run build`, output folder `dist`, with the "single page app" fallback turned on.

### Only the explainer, inside the current site builder

`embed/index.html` is the explainer as one file (about 1.4 MB, no external scripts). Host it
anywhere and paste this into an Embed / Custom HTML block:

```html
<iframe
  src="https://briankthegreat-cyber.github.io/DFTG/embed.html"
  title="Inside the gut: an interactive 3D explainer of inflammatory bowel disease"
  style="width:100%;aspect-ratio:16/10;border:0;border-radius:16px;overflow:hidden"
  loading="lazy"
  allow="fullscreen"
  allowfullscreen
  referrerpolicy="no-referrer"
></iframe>
```

Options for the embed URL:

| Parameter | Effect |
| --- | --- |
| `?theme=light` | Cream stage instead of the forest-green one |
| `?chapter=uc` | Start at a chapter: `healthy`, `ibd`, `crohns`, `uc`, `flares`, `next` |
| `?autoplay=0` | Start paused |
| `?loop=1` | Loop the tour |
| `?inset=0` | Hide the bowel-wall inset |
| `?ui=0` | Hide all controls and text (3D only) |
| `?ambient=1` | Calm, slowly drifting healthy gut with no controls (what the home page hero uses) |
| `?quality=low` | Force the lighter render path (no bloom or shadows) |
| `?link=https://...` | Where the "Learn more" button goes (https only) |
| `?cta=...` | Label of that button (plain text, up to 40 characters) |

## Before launch

- **Clinician review.** Read `src/ibd/content.ts` and the IBD/IBS guides in `src/site/data.ts`; fill in the `REVIEW` block (name and date) so it shows in the explainer's info panel.
- **Instagram and email.** Set `org.instagram` and `org.email` in `src/site/data.ts`.
- **Donations, shop checkout, newsletter.** These are honest placeholders. The donate box, "add to bag", and newsletter form explain that processing connects at launch and store nothing. Wire them to Stripe / Shopify / a newsletter provider when the foundation's accounts exist.
- **Product photos.** `ProductArt` in `src/site/components/ui.tsx` draws placeholder tiles. Swap in real photos when samples are shot.
- **Community stories.** The three quotes are marked as representative examples on the page. Replace them with consented submissions.

## Design

- Palette: cream `#f3efe6`, ivory `#faf7f1`, forest `#1f3b2d`, peach `#e8a27e`, sage `#b9c9b1`, with pale tints for panels. Tokens are in `src/index.css`.
- Type: Instrument Serif for display (italic peach accent phrases), Inter for body.
- Motion: React Bits `SplitText`, `AnimatedContent`, `ScrollVelocity`, `CountUp`, `SpotlightCard`, `StarBorder`, `Magnet`, `ShinyText`, `BlurText`, `FadeContent` (see `src/react-bits/README.md`). Everything honours `prefers-reduced-motion`.
- The 3D explainer: stomach, small intestine and colon are built procedurally from curves; a custom shader draws peristalsis, Crohn’s skip lesions with wall thickening and creeping fat, and the continuous rectum-first spread of ulcerative colitis with ulcers and loss of haustra. A bowel-wall inset shows which layers each disease involves.

## Project layout

```
dftg-site/
  index.html, embed.html        Two entries: the site and the standalone explainer
  src/main.tsx                  Site bootstrap (router)
  src/embed.tsx                 Explainer bootstrap (reads URL options)
  src/index.css                 Tailwind + brand tokens + explainer theme tokens
  src/site/
    data.ts                     ALL website copy
    App.tsx                     Routes
    components/                 SiteLayout (header, footer, bag), ui, sections
    pages/                      Home, Learn, UnderstandIbd, UnderstandIbs, Community, GetInvolved, Shop, NotFound
  src/explainer/                Explainer component and its styles
  src/ibd/                      Framework-free explainer model (anatomy, conditions, timeline, content, shaders), unit tested
  src/scene/                    react-three-fiber scene components and capture API
  src/ui/                       Explainer overlay (chapter card, controls, labels, inset)
  src/react-bits/               Vendored React Bits components (MIT + Commons Clause)
  scripts/                      make-preview, screenshots, site-screenshots, render-video
  test/unit, test/e2e           node:test unit tests, Playwright browser tests
  embed/index.html              The committed single-file explainer
```

## Medical accuracy notes

- Anatomy is stylised but ordered correctly and shown from the front. Crohn’s: skip lesions, terminal ileum emphasis, transmural involvement, wall thickening, creeping fat, rectum often spared, mouth-to-anus wording. Ulcerative colitis: rectum-first, continuous, colon-only, inner-lining depth, ulcers, loss of haustra, named extents.
- Flares and remission are shown as reversible; no page implies inevitable worsening. IBD is described as not IBS, not contagious, and not caused by stress or food.
- Every page carries the education-only disclaimer and links to primary sources (Crohn’s & Colitis Foundation, NIDDK, ACG, Rome Foundation).
