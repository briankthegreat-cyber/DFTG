import { expect, test } from '@playwright/test';

const routes = ['/', '/learn', '/learn/ibd', '/learn/ibs', '/community', '/get-involved', '/shop'];

test('every page has a unique title, a description, a canonical link, one h1 and structured data', async ({ page }) => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const route of routes) {
    await page.goto(route);
    // The prerendered HTML already carries a canonical link, so wait for the app itself to mount.
    await page.locator('#root h1').first().waitFor({ timeout: 30_000 });
    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    const h1Count = await page.locator('h1').count();
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();

    expect(title.length, `${route} title`).toBeGreaterThan(10);
    expect(titles.has(title), `${route} duplicate title: ${title}`).toBe(false);
    titles.add(title);
    expect(description ?? '', `${route} description`).toMatch(/.{50,}/);
    expect(descriptions.has(description!), `${route} duplicate description`).toBe(false);
    descriptions.add(description!);
    expect(canonical, `${route} canonical`).toMatch(/^https:\/\//);
    expect(canonical!.endsWith(route === '/' ? '' : route), `${route} canonical path`).toBe(true);
    expect(ogImage, `${route} og:image`).toMatch(/\.jpg$/);
    expect(h1Count, `${route} h1 count`).toBe(1);
    expect(jsonLd.length, `${route} json-ld`).toBeGreaterThanOrEqual(2);
    for (const block of jsonLd) expect(() => JSON.parse(block)).not.toThrow();
  }
});

test('inner pages show breadcrumbs and related links', async ({ page }) => {
  await page.goto('/learn/ibd');
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs).toContainText('Learn');
  await expect(crumbs).toContainText('Understand IBD');
  await expect(page.getByRole('heading', { name: 'Keep going' })).toBeVisible();
});

test('unknown routes render the custom 404 page with noindex', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('moved on');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('crawler files are served', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain('Sitemap:');
  const llms = await request.get('/llms.txt');
  expect(llms.ok()).toBe(true);
  expect(await llms.text()).toContain('Don’t Fret the Gut');
  const manifest = await request.get('/site.webmanifest');
  expect(manifest.ok()).toBe(true);
  const favicon = await request.get('/favicon.svg');
  expect(favicon.ok()).toBe(true);
});
