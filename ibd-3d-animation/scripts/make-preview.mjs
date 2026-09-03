// Turns dist-preview/ (the single-chunk Vite build) into one self-contained HTML file
// at site/index.html, plus an artifact fragment (no <html>/<head>/<body>) for previews.
import fs from 'node:fs';
import path from 'node:path';

const dir = 'dist-preview';
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const read = (f) => fs.readFileSync(path.join(dir, f.replace(/^\.\//, '')), 'utf8');

let css = '';
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => { css += read(href); return ''; });
let js = '';
html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) => { js += read(src); return ''; });
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
js = js.replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--');

const title = (html.match(/<title>(.*?)<\/title>/) || [])[1] || 'Inside the Gut';
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
fs.mkdirSync('site', { recursive: true });
fs.writeFileSync('site/index.html', full);

const fragment = `<title>Inside the Gut</title>
${fonts}
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
fs.mkdirSync('preview', { recursive: true });
fs.writeFileSync('preview/ibd-artifact.html', fragment);
console.log('site/index.html', (full.length / 1024 / 1024).toFixed(2), 'MB');
