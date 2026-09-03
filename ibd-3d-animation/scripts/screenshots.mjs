// Renders one still per chapter (plus light theme and phone layout) from site/index.html.
// Usage: node scripts/screenshots.mjs [outDir]
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { serveStatic } from './serve-static.mjs';

const outDir = process.argv[2] || 'shots';
fs.mkdirSync(outDir, { recursive: true });
const { server, url } = await serveStatic('site');
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function shoot(name, { viewport, query, times }) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${url}/?capture=1${query}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ibd && window.__ibd.ready, null, { timeout: 60000 });
  await page.evaluate(() => window.__ibd.ready);
  for (const [label, t] of times) {
    await page.evaluate((tt) => window.__ibd.setTime(tt, { snap: true, passes: 3 }), t);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(outDir, `${name}-${label}.png`) });
    console.log('saved', `${name}-${label}.png`);
  }
  if (errors.length) console.log('page errors:', errors.slice(0, 5));
  await page.close();
}

const chapters = [['healthy', 6], ['ibd', 16], ['crohns', 29], ['uc', 44], ['flares', 54], ['next', 66]];
await shoot('desktop', { viewport: { width: 1280, height: 800 }, query: '&quality=high', times: chapters });
await shoot('lowq', { viewport: { width: 1280, height: 800 }, query: '&quality=low', times: [['crohns', 29]] });
await shoot('light', { viewport: { width: 1280, height: 800 }, query: '&theme=light&quality=high', times: [['healthy', 6], ['uc', 44]] });
await shoot('phone', { viewport: { width: 390, height: 780 }, query: '', times: [['crohns', 29]] });
await browser.close();
server.close();
