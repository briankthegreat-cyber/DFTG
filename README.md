# DFTG Websites

A ready-to-use website workspace built on **React + Vite + Tailwind CSS**, with the full
[React Bits](https://reactbits.dev) animated component library vendored in. New sites are
built here by adding pages under `src/pages/`.

## What is in this repo

| Path | Purpose |
| --- | --- |
| `src/react-bits/` | 171 React Bits components (TypeScript + Tailwind variant). See its README for licensing and how to update. |
| `src/react-bits/COMPONENTS.md` | Index of every component with a one-line description. Useful when choosing effects. |
| `src/pages/` | One file per page. `Home.tsx` is a demo page that proves the setup works. |
| `src/App.tsx` | Routes. Add a `<Route>` here for each new page. |
| `src/index.css` | Global styles and the Tailwind import. |

## Running it on your computer

1. Install [Node.js](https://nodejs.org) (version 20 or newer).
2. Open a terminal in this folder and run:

```bash
npm install
npm run dev
```

3. Open the address it prints (usually http://localhost:5173).

Other commands:

```bash
npm run build      # production build into dist/
npm run preview    # preview the production build
npm run typecheck  # TypeScript check
```

## Deploying

`npm run build` produces a static `dist/` folder that can be uploaded to Vercel, Netlify,
Cloudflare Pages, or any static host. Because the site uses client-side routing, configure
the host to serve `index.html` for unknown paths (all three hosts above have a one-line
setting for this).

## Requesting a new website

Describe the site (audience, pages, tone, colors, any copy or images) and it will be built
as pages in this repo using the React Bits components. Each site can live on its own branch
or as its own set of routes.

## Licensing

React Bits is MIT + Commons Clause. Using its components inside websites we build, including
commercial ones, is permitted. Reselling or redistributing the components themselves as a
library is not. The full license is at `src/react-bits/LICENSE.md`.
