import { expect, test } from '@playwright/test';

/**
 * Main Quiz vertical slice: start a session, answer an identify question by
 * clicking the model, receive graded feedback, and finish with results.
 */

test('complete an identify-on-model quiz session', async ({ page }) => {
  await page.goto('/#/quiz');
  await expect(page.getByTestId('banner-fixture')).toBeVisible();
  // Quiz availability depends on loaded geometry.
  await expect(page.getByTestId('load-status')).toContainText('ready', { timeout: 30_000 });

  await page.getByTestId('quiz-start').click();
  await expect(page.getByTestId('quiz-prompt')).toBeVisible();

  const canvas = page.locator('canvas').first();
  const total = 5;
  for (let i = 0; i < total; i++) {
    const prompt = page.getByTestId('quiz-prompt');
    await expect(prompt).toBeVisible();
    const isIdentify = (await prompt.getByText('Click the structure on the model.').count()) > 0;
    if (isIdentify) {
    const box = await canvas.boundingBox();
    if (!box) throw new Error('canvas not measurable');
    const feedback = page.getByTestId('quiz-feedback');
    // Probe the visible model area until a real mesh is picked. Any picked mesh is a
    // valid identify response; grading still happens by stable structure_id.
    probeLoop: for (const y of [0.3, 0.4, 0.5, 0.6, 0.7]) {
for (const x of [0.3, 0.4, 0.5, 0.6, 0.7]) {
  await canvas.click({ position: { x: box.width * x, y: box.height * y } });
  await page.waitForTimeout(40);
  if ((await feedback.count()) > 0) break probeLoop;
}
    }
  } else {
      await prompt.locator('[data-testid^="quiz-option-"]').first().click();
    }
    const feedback = page.getByTestId('quiz-feedback');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText(/Correct|Incorrect/);
    await page.getByTestId('quiz-next').click();
  }

  await expect(page.getByTestId('quiz-results')).toBeVisible();
  await expect(page.getByTestId('quiz-results')).toContainText(/\/ \d+ correct/);
});

test('identify answers can also be given from the accessible list', async ({ page }) => {
  await page.goto('/#/quiz');
  await expect(page.getByTestId('load-status')).toContainText('ready', { timeout: 30_000 });
  await page.getByTestId('quiz-start').click();

  const prompt = page.getByTestId('quiz-prompt');
  await expect(prompt).toBeVisible();
  if ((await prompt.getByText('Click the structure on the model.').count()) > 0) {
    await prompt.getByRole('button', { name: 'Answer from a list instead' }).click();
    await prompt.locator('[data-testid^="quiz-option-"]').first().click();
  } else {
    await prompt.locator('[data-testid^="quiz-option-"]').first().click();
  }
  await expect(page.getByTestId('quiz-feedback')).toBeVisible();
});
