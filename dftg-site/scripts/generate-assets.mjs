// Generates favicons, app icons, social share images and explainer posters into public/.
// Run after copy changes: `npm run assets` (needs the embed build for the posters: `npm run build:embed`).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { serveStatic } from './serve-static.mjs';
import { hero, ibdPage, ibsPage, community, getInvolved, shop, org, learn } from '../src/site/data.ts';

const out = 'public';
fs.mkdirSync(path.join(out, 'og'), { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const fonts = `<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">`;
const display = `'Instrument Serif','Iowan Old Style','Palatino Linotype','Times New Roman',serif`;
const sans = `'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif`;

// ---- monogram icons -------------------------------------------------------
async function icon(size, file, { padding = 0 } = {}) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const inner = size - padding * 2;
  await page.setContent(`<!doctype html>${fonts}<body style="margin:0;background:${padding ? '#f3efe6' : 'transparent'}">
    <div style="position:absolute;left:${padding}px;top:${padding}px;width:${inner}px;height:${inner}px;border-radius:50%;background:#f3efe6;border:${Math.max(1.5, inner * 0.045)}px solid #1f3b2d;box-sizing:border-box;display:grid;place-items:center;font:italic ${inner * 0.34}px/1 ${display};color:#1f3b2d">dftg</div>
  </body>`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, file), omitBackground: !padding });
  await page.close();
  console.log('icon', file);
}
await icon(32, 'favicon-32.png');
await icon(180, 'apple-touch-icon.png', { padding: 14 });
await icon(192, 'icon-192.png', { padding: 12 });
await icon(512, 'icon-512.png', { padding: 32 });

// ---- social share images (1200x630) ---------------------------------------
async function og(file, { eyebrow, lead, accent, note }) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html>${fonts}<body style="margin:0;width:1200px;height:630px;background:#f3efe6;font-family:${sans};color:#1f3b2d;position:relative;overflow:hidden">
    <div style="position:absolute;right:-90px;top:-90px;width:340px;height:340px;border-radius:50%;background:#e8a27e;opacity:.92"></div>
    <div style="position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:16px">
      <div style="width:56px;height:56px;border-radius:50%;border:2px solid #1f3b2d;display:grid;place-items:center;font:italic 22px/1 ${display}">dftg</div>
      <div style="font:400 20px/1.1 ${display}">Don’t Fret<br>the Gut</div>
    </div>
    <div style="position:absolute;left:72px;top:170px;font:600 14px/1 ${sans};letter-spacing:.28em;text-transform:uppercase"><span style="display:inline-block;width:36px;height:1px;background:#e8a27e;vertical-align:middle;margin-right:14px"></span>${eyebrow}</div>
    <div style="position:absolute;left:72px;top:212px;width:900px;font:400 ${lead.length + accent.length > 40 ? 78 : 92}px/0.98 ${display};letter-spacing:-.015em;text-wrap:balance">${lead} <em style="color:#e8a27e">${accent}</em></div>
    <div style="position:absolute;left:72px;bottom:56px;right:72px;display:flex;justify-content:space-between;align-items:flex-end;font:400 20px/1.4 ${sans};color:#5c6a64">
      <span style="max-width:720px">${note}</span>
      <span style="font-weight:600;color:#1f3b2d">Digestive health, spoken plainly</span>
    </div>
  </body>`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'og', file), type: 'jpeg', quality: 84 });
  await page.close();
  console.log('og', file);
}
await og('home.jpg', { eyebrow: 'Don’t Fret the Gut', lead: hero.titleLead, accent: hero.titleAccent, note: org.mission });
await og('learn.jpg', { eyebrow: learn.eyebrow, lead: learn.titleLead, accent: learn.titleAccent, note: learn.body });
await og('ibd.jpg', { eyebrow: ibdPage.eyebrow, lead: ibdPage.titleLead, accent: ibdPage.titleAccent, note: 'An interactive 3D explainer of Crohn’s disease and ulcerative colitis, plus a plain-language guide.' });
await og('ibs.jpg', { eyebrow: ibsPage.eyebrow, lead: ibsPage.titleLead, accent: ibsPage.titleAccent, note: 'What IBS is, why it happens, and what helps. Your symptoms are real.' });
await og('community.jpg', { eyebrow: 'Community', lead: community.titleLead, accent: community.titleAccent, note: community.body });
await og('get-involved.jpg', { eyebrow: getInvolved.label, lead: getInvolved.titleLead, accent: getInvolved.titleAccent, note: getInvolved.body });
await og('shop.jpg', { eyebrow: shop.label, lead: shop.titleLines[0], accent: shop.titleLines[1], note: shop.body });

// ---- explainer posters (from the built embed) -----------------------------
if (fs.existsSync('embed/index.html')) {
  const { server, url } = await serveStatic('embed');
  async function poster(file, { width, height, query, time }) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(`${url}/?capture=1&quality=high${query}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__ibd && window.__ibd.ready, null, { timeout: 90000 });
    await page.evaluate(() => window.__ibd.ready);
    await page.evaluate((t) => window.__ibd.setTime(t, { snap: true, passes: 3 }), time);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(out, 'og', file), type: 'jpeg', quality: 86 });
    await page.close();
    console.log('poster', file);
  }
  await poster('poster-explainer.jpg', { width: 1280, height: 800, query: '', time: 6 });
  await poster('poster-hero.jpg', { width: 900, height: 1125, query: '&ui=0&labels=0&inset=0', time: 6 });
  server.close();
} else {
  console.log('embed/index.html missing; skipped posters (run npm run build:embed first)');
}
await browser.close();
