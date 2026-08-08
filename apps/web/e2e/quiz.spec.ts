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
      // Click the model (trunk area). Correctness is graded by structure_id;
      // both correct and incorrect answers must produce feedback.
      await canvas.click({ position: { x: box.width / 2, y: box.height * 0.42 } });
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
