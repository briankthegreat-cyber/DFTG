import { expect, test } from '@playwright/test';

test('home page renders the hero, sections and navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your gut story');
  await expect(page.getByRole('link', { name: 'Understand IBD' }).first()).toBeVisible();
  await expect(page.getByText('Similar names.')).toBeVisible();
  await expect(page.getByRole('heading', { name: /There is strength/ })).toBeVisible();
  await page.getByRole('link', { name: 'Shop', exact: true }).first().click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Wear what');
  expect(errors).toEqual([]);
});

test('Understand IBD page embeds the 3D explainer and the written guide', async ({ page }) => {
  await page.goto('/learn/ibd');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Inflammation');
  await page.waitForSelector('canvas', { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Crohn’s disease', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'When to seek care right away' })).toBeVisible();
});

test('shop bag counts items and donate tiers switch', async ({ page }) => {
  await page.goto('/shop');
  await page.getByRole('button', { name: /Add Washed Script Tee/ }).click();
  await expect(page.getByRole('link', { name: /^Bag/ })).toContainText('1');
  await page.goto('/get-involved');
  await page.getByText('$100', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Donate $100' })).toBeVisible();
});
