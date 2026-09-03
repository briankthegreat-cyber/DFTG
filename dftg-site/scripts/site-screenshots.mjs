// Stills of every site route from dist/ (run `npm run build` first): the top of each page plus
// viewport-sized captures further down, so scroll-triggered reveals are exercised the way a reader sees them.
// Usage: node scripts/site-screenshots.mjs [outDir]
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { serveStatic } from './serve-static.mjs';

const outDir = process.argv[2] || 'shots-site';
fs.mkdirSync(outDir, { recursive: true });
const { server, url } = await serveStatic('dist', 0, { spa: true });
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const routes = ['/', '/learn', '/learn/ibd', '/learn/ibs', '/community', '/get-involved', '/shop'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const viewport of [{ name: 'desktop', width: 1440, height: 900, shots: 6 }, { name: 'phone', width: 390, height: 844, shots: 4 }]) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  for (const route of routes) {
    try {
      await page.goto(`${url}${route}`, { waitUntil: 'domcontentloaded' });
    } catch (e) {
      console.log('goto failed for', route, String(e).slice(0, 120));
      continue;
    }
    await sleep(3000);
    const name = route === '/' ? 'home' : route.slice(1).replace(/\//g, '-');
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const count = route === '/' ? viewport.shots : Math.min(viewport.shots, 3);
    for (let i = 0; i < count; i++) {
      const y = Math.round((height - viewport.height) * (i / Math.max(1, count - 1)));
      await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
      await sleep(1600);
      await page.screenshot({ path: path.join(outDir, `${viewport.name}-${name}-${i}.png`) });
    }
    console.log('saved', `${viewport.name}-${name}-*.png`, `(${height}px tall)`);
  }
  if (errors.length) console.log(viewport.name, 'page errors:', errors.slice(0, 5));
  await page.close();
}
await browser.close();
server.close();
