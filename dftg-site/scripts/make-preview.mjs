// Inlines a single-chunk Vite build (dist-preview/) into one self-contained HTML file.
//   node scripts/make-preview.mjs embed  -> embed/index.html + preview/ibd-artifact.html (fragment)
//   node scripts/make-preview.mjs site   -> preview/dftg-site.html (full) + preview/dftg-site-artifact.html (fragment)
import fs from 'node:fs';
import path from 'node:path';

const which = process.argv[2] === 'site' ? 'site' : 'embed';
const dir = 'dist-preview';
const source = which === 'site' ? 'index.html' : 'embed.html';
let html = fs.readFileSync(path.join(dir, source), 'utf8');
const read = (f) => fs.readFileSync(path.join(dir, f.replace(/^\.\//, '')), 'utf8');

let css = '';
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => { css += read(href); return ''; });
let js = '';
html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) => { js += read(src); return ''; });
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
js = js.replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--');

const title = (html.match(/<title>(.*?)<\/title>/) || [])[1] || 'Don’t Fret the Gut';
const fonts = [...html.matchAll(/<link[^>]+fonts\.g[^>]*>/g)].map((m) => m[0]).join('\n');
const metas = [...html.matchAll(/<meta[^>]*>/g)].map((m) => m[0]).join('\n');

const full = `<!doctype html>
<html lang="en">
<head>
${metas}
${fonts}
<title>${title}</title>
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script type="module">${js}</script>
</body>
</html>
`;
const fragment = `<title>${which === 'site' ? 'Don’t Fret the Gut' : 'Inside the Gut'}</title>
${fonts}
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
fs.mkdirSync('preview', { recursive: true });
if (which === 'embed') {
  fs.mkdirSync('embed', { recursive: true });
  fs.writeFileSync('embed/index.html', full);
  fs.writeFileSync('preview/ibd-artifact.html', fragment);
  console.log('embed/index.html', (full.length / 1024 / 1024).toFixed(2), 'MB');
} else {
  fs.writeFileSync('preview/dftg-site.html', full);
  fs.writeFileSync('preview/dftg-site-artifact.html', fragment);
  console.log('preview/dftg-site.html', (full.length / 1024 / 1024).toFixed(2), 'MB');
}
