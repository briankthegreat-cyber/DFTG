// Renders the full tour to a video by stepping the deterministic clock frame by frame.
// Usage: node scripts/render-video.mjs [--fps 30] [--width 1280] [--height 720]
//        [--out site/ibd-animation.mp4] [--ffmpeg /path/to/ffmpeg] [--start 0] [--duration N]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { serveStatic } from './serve-static.mjs';

const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];
const fps = Number(args.fps ?? 30);
const width = Number(args.width ?? 1280);
const height = Number(args.height ?? 720);
const out = args.out ?? 'site/ibd-animation.mp4';
const ffmpeg = args.ffmpeg ?? process.env.FFMPEG ?? 'ffmpeg';
const framesDir = args.frames ?? '.video-frames';
const start = Number(args.start ?? 0);

fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });
fs.mkdirSync(path.dirname(out), { recursive: true });

const { server, url } = await serveStatic('site');
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('page error:', e));
await page.goto(`${url}/?capture=1&quality=high`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__ibd && window.__ibd.ready, null, { timeout: 60000 });
await page.evaluate(() => window.__ibd.ready);
const total = Number(args.duration ?? (await page.evaluate(() => window.__ibd.totalDuration)));
const frames = Math.ceil((total - start) * fps);
console.log(`rendering ${frames} frames at ${fps} fps (${width}x${height})`);

await page.evaluate((t) => window.__ibd.setTime(t, { snap: true, passes: 3 }), start);
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  const t = start + i / fps;
  await page.evaluate((tt) => window.__ibd.setTime(tt), t);
  await page.screenshot({ path: path.join(framesDir, `${String(i).padStart(5, '0')}.png`), type: 'png' });
  if (i % 60 === 0) {
    const elapsed = (Date.now() - t0) / 1000;
    console.log(`frame ${i}/${frames} · ${elapsed.toFixed(0)}s elapsed · eta ${((elapsed / (i + 1)) * (frames - i)).toFixed(0)}s`);
  }
}
await browser.close();
server.close();

const isWebm = out.endsWith('.webm');
const codecArgs = isWebm
  ? ['-c:v', 'libvpx', '-b:v', '4M', '-quality', 'good', '-cpu-used', '1']
  : ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'slow', '-profile:v', 'high', '-movflags', '+faststart'];
const result = spawnSync(ffmpeg, ['-y', '-framerate', String(fps), '-i', path.join(framesDir, '%05d.png'), ...codecArgs, '-r', String(fps), out], { stdio: 'inherit' });
if (result.status !== 0) {
  console.error('ffmpeg failed; frames kept in', framesDir);
  process.exit(1);
}
console.log('wrote', out, (fs.statSync(out).size / 1024 / 1024).toFixed(1), 'MB');
