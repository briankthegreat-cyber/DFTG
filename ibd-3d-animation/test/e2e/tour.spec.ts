import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    __ibd: { ready: Promise<void>; setTime(t: number, o?: { snap?: boolean; passes?: number }): Promise<void>; totalDuration: number };
  }
}

test('renders the 3D tour with WebGL and no page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/?capture=1');
  await page.waitForFunction(() => Boolean(window.__ibd), null, { timeout: 60_000 });
  await page.evaluate(() => window.__ibd.ready);
  const canvases = page.locator('canvas');
  expect(await canvases.count()).toBeGreaterThanOrEqual(1);
  const hasGl = await page.evaluate(() => {
    const c = document.querySelector('canvas') as HTMLCanvasElement;
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  });
  expect(hasGl).toBe(true);
  expect(errors).toEqual([]);
});

test('chapter content follows the timeline', async ({ page }) => {
  await page.goto('/?capture=1');
  await page.waitForFunction(() => Boolean(window.__ibd), null, { timeout: 60_000 });
  await page.evaluate(() => window.__ibd.ready);
  await expect(page.getByRole('heading', { level: 2 })).toContainText('healthy gut');
  await page.evaluate(() => window.__ibd.setTime(29, { snap: true }));
  await expect(page.getByRole('heading', { level: 2 })).toContainText('Crohn');
  await page.evaluate(() => window.__ibd.setTime(44, { snap: true }));
  await expect(page.getByRole('heading', { level: 2 })).toContainText('Ulcerative colitis');
  await expect(page.getByRole('tab', { selected: true })).toContainText('Ulcerative colitis');
});

test('chapter pills seek and play/pause toggles', async ({ page }) => {
  await page.goto('/?autoplay=0');
  await page.waitForSelector('canvas');
  const play = page.getByRole('button', { name: /play tour/i });
  await expect(play).toBeVisible();
  await page.getByRole('tab', { name: /Flares/ }).click();
  await expect(page.getByRole('tab', { selected: true })).toContainText('Flares');
  await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();
  await page.getByRole('button', { name: /pause/i }).click();
  await expect(page.getByRole('button', { name: /play tour/i })).toBeVisible();
});
