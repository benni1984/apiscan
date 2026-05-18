import { test, expect } from '@playwright/test';

test('create a hive, view its detail page, then clean up', async ({ page }) => {
  const tag = Date.now();
  const apiaryName = `e2e-apiary-${tag}`;
  const hiveName = `e2e-hive-${tag}`;

  await test.step('create a temporary apiary', async () => {
    await page.goto('/dashboard');
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
    await page.locator('button.dash-new-btn').click();
    await page.locator('.dash-inline-form input[type="text"]').fill(apiaryName);
    await page.locator('button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
  });

  await test.step('navigate into the apiary', async () => {
    await page.locator('.dash-apiary-card', { hasText: apiaryName }).click();
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
    await expect(page.locator('h1.dash-page-title')).toContainText(apiaryName);
  });

  await test.step('create a hive', async () => {
    await page.locator('button.dash-new-btn', { hasText: 'New Hive' }).click();
    await page.locator('.dash-inline-form input[type="text"]').fill(hiveName);
    await page.locator('.dash-inline-form button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.dash-hive-card', { hasText: hiveName })).toBeVisible();
  });

  await test.step('navigate into the hive and verify detail page', async () => {
    await page.locator('.dash-hive-card', { hasText: hiveName }).click();
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
    await expect(page.locator('h1.dash-page-title')).toContainText(hiveName);
    await expect(page.locator('p.dash-hive-type-label')).toContainText('langstroth');
    await expect(page.locator('h2.dash-section-title', { hasText: 'Varroa Trend' })).toBeVisible();
    await expect(page.locator('button.dash-new-btn', { hasText: 'New Inspection' })).toBeVisible();
  });

  await test.step('delete the hive', async () => {
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Delete Hive' }).click();
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Confirm Delete' }).click();
    // Redirects back to apiary
    await expect(page.locator('h1.dash-page-title')).toContainText(apiaryName, { timeout: 15_000 });
  });

  await test.step('delete the temporary apiary', async () => {
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Delete Apiary' }).click();
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Confirm Delete' }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  });
});
