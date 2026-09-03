// Bakes each route's <head> (title, description, canonical, social tags, JSON-LD) plus a
// <noscript> summary into static HTML at dist/<route>/index.html, so crawlers, link previews and
// readers without JavaScript see the right thing. The app itself still mounts normally.
// Also writes sitemap.xml, robots.txt and 404.html. Run after `vite build`, with the same
// VITE_BASE / VITE_SITE_URL the build used.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { serveStatic } from './serve-static.mjs';

const SITE_URL = (process.env.VITE_SITE_URL || 'https://briankthegreat-cyber.github.io/DFTG').replace(/\/$/, '');
const BASE = process.env.VITE_BASE || '/';
const dist = 'dist';
const routes = ['/', '/learn', '/learn/ibd', '/learn/ibs', '/community', '/get-involved', '/shop'];
const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

// GitHub Pages serves 404.html for unknown paths; the app shell lets the router show the 404 page.
fs.writeFileSync(path.join(dist, '404.html'), shell);

const { server, url } = await serveStatic(dist, 0, { spa: true, base: BASE });
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(120000);
const basePrefix = BASE.replace(/\/$/, '');

function stripDefaults(html) {
  return html
    .replace(/<title>[^<]*<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace(/<meta property="og:site_name"[^>]*>\s*/, '')
    .replace(/<meta property="og:type"[^>]*>\s*/, '')
    .replace(/<meta name="twitter:card"[^>]*>\s*/, '');
}

for (const route of routes) {
  await page.goto(`${url}${basePrefix}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('link[rel="canonical"]') !== null && document.querySelector('h1') !== null);
  await page.waitForTimeout(800);
  const captured = await page.evaluate(() => {
    const parts = [`<title>${document.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>`];
    document.head.querySelectorAll('meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], script[data-seo]').forEach((el) => parts.push(el.outerHTML));
    const h1 = document.querySelector('h1')?.textContent?.trim() ?? '';
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    const links = Array.from(document.querySelectorAll('nav[aria-label="Primary"] a')).map((a) => `<li><a href="${a.getAttribute('href')}">${a.textContent}</a></li>`).join('');
    return { head: parts.join('\n    '), h1, description, links };
  });
  const noscript = `<noscript><main style="font-family:Georgia,serif;max-width:60ch;margin:3rem auto;padding:0 1rem"><h1>${captured.h1}</h1><p>${captured.description}</p><p>This site needs JavaScript for its interactive parts. The pages:</p><ul>${captured.links}</ul></main></noscript>`;
  const html = stripDefaults(shell)
    .replace('</head>', `    ${captured.head}\n  </head>`)
    .replace('<div id="root"></div>', `${noscript}\n    <div id="root"></div>`);
  const file = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log('prerendered', route, '->', path.relative(dist, file));
}
await browser.close();
server.close();

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((r) => `  <url><loc>${SITE_URL}${r === '/' ? '/' : r}</loc><lastmod>${today}</lastmod><changefreq>${r === '/' ? 'weekly' : 'monthly'}</changefreq><priority>${r === '/' ? '1.0' : r.startsWith('/learn') ? '0.9' : '0.7'}</priority></url>`)
  .join('\n')}
  <url><loc>${SITE_URL}/embed.html</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
// Keep the video next to embed.html so the standalone page's fallback and VideoObject URLs resolve.
if (fs.existsSync('embed/ibd-animation.mp4')) fs.copyFileSync('embed/ibd-animation.mp4', path.join(dist, 'ibd-animation.mp4'));
console.log('wrote sitemap.xml, robots.txt, 404.html');
