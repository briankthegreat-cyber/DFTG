// Turns dist-preview/ into one self-contained HTML fragment for publishing as a preview page.
import fs from 'node:fs';
import path from 'node:path';

const dir = 'dist-preview';
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const read = f => fs.readFileSync(path.join(dir, f.replace(/^\.\//, '')), 'utf8');
const svgToDataUri = f => 'data:image/svg+xml;base64,' + fs.readFileSync(path.join('public', f)).toString('base64');

const assets = ['bhh/logo.svg', 'bhh/logo-cream.svg', 'bhh/mark.svg', 'bhh/mark-cream.svg', 'bhh/dr-katiraie.svg'];
const swapAssets = s => assets.reduce((acc, f) => acc.split('/' + f).join(svgToDataUri(f)), s);

let css = '';
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => { css += read(href); return ''; });
let js = '';
html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) => { js += read(src); return ''; });
js = swapAssets(js).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--');
css = swapAssets(css).split('/fonts/allison.woff2').join('data:font/woff2;base64,' + fs.readFileSync('public/fonts/allison.woff2').toString('base64'));

const title = (html.match(/<title>(.*?)<\/title>/) || [])[1] || 'Preview';
const fonts = [...html.matchAll(/<link[^>]+fonts\.googleapis[^>]*>/g)].map(m => m[0]).join('\n');
const out = `<title>${title}</title>
${fonts}
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
fs.mkdirSync('preview', { recursive: true });
fs.writeFileSync('preview/bhh-preview.html', out);
console.log('preview/bhh-preview.html', (out.length / 1024 / 1024).toFixed(2), 'MB');
