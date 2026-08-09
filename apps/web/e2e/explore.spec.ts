import { expect, test } from '@playwright/test';

/**
 * Main Explore vertical slice: app loads fixture data through the manifest
 * pipeline, model appears, selection works from search, hierarchy AND the
 * real 3D canvas, details panel updates, isolate + reset + undo work.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // The fixture banner must be visible whenever fixture data is loaded.
  await expect(page.getByTestId('banner-fixture')).toBeVisible();
  // Initial bundle loads progressively; wait for ready state.
  await expect(page.getByTestId('bundle-state-fixture-frame')).toHaveText('ready', {
    timeout: 30_000,
  });
});

test('select via search, then isolate, reset and undo', async ({ page }) => {
  await page.getByTestId('search-input').fill('torso block');
  const results = page.getByTestId('search-result');
  await expect(results.first()).toContainText('Fixture Trunk Column');
  // Synonym matches explain themselves.
  await expect(results.first()).toContainText('syn:');
  await results.first().click();

  await expect(page.getByTestId('details-name')).toHaveText('Fixture Trunk Column');
  await expect(page.getByTestId('details-panel')).toContainText('fixture_frame');
  await expect(page.getByTestId('details-geometry-status')).toHaveText('Loaded');

  // Isolate, then exit isolation via reset visibility.
  await page.getByTestId('btn-isolate').click();
  await expect(page.getByTestId('btn-clear-isolation')).toBeEnabled();
  await page.getByTestId('btn-reset-visibility').click();
  await expect(page.getByTestId('btn-clear-isolation')).toBeDisabled();

  // Hide is undoable.
  await page.getByTestId('btn-hide').click();
  await expect(page.getByTestId('details-geometry-status')).toHaveText('Hidden');
  await page.getByTestId('btn-undo').click();
  await expect(page.getByTestId('details-geometry-status')).toHaveText('Loaded');
});

test('select by clicking the real 3D mesh', async ({ page }) => {
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  // Give the camera reset animation a moment to settle.
  await page.waitForTimeout(1200);
  const box = await canvas.boundingBox();
  test.skip(!box, 'canvas has no bounding box');
  if (!box) return;
  // The trunk column spans the mid-upper screen center in the anterior fit view.
  await canvas.click({ position: { x: box.width / 2, y: box.height * 0.42 } });
  await expect(page.getByTestId('details-name')).toHaveText(/Fixture (Trunk Column|Head Block)/);
});

test('select via hierarchy converges to the same details state', async ({ page }) => {
  const treeRow = page.getByTestId('tree-row-FIX-S-TRUNK');
  await treeRow.getByRole('button', { name: 'Fixture Trunk Column', exact: true }).click();
  await expect(page.getByTestId('details-name')).toHaveText('Fixture Trunk Column');
  await expect(page.getByTestId('details-geometry-status')).toHaveText('Loaded');
});

test('missing geometry is reported honestly', async ({ page }) => {
  await page.getByTestId('search-input').fill('Fixture Ghost Node');
  await page.getByTestId('search-result').first().click();
  await expect(page.getByTestId('details-name')).toHaveText('Fixture Ghost Node');
  await expect(page.getByTestId('details-geometry-status')).toHaveText(
    'No 3D geometry available yet',
  );
});

test('second bundle loads progressively on demand', async ({ page }) => {
  await expect(page.getByTestId('bundle-state-fixture-core')).toHaveText('not loaded');
  await page.getByTestId('bundle-load-fixture-core').click();
  await expect(page.getByTestId('bundle-state-fixture-core')).toHaveText('ready', {
    timeout: 30_000,
  });
});
