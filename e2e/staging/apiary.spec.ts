import { test, expect } from '@playwright/test';

test('create, rename, and delete an apiary', async ({ page }) => {
  const tag = Date.now();
  const name = `e2e-apiary-${tag}`;
  const renamed = `e2e-apiary-${tag}-renamed`;

  await test.step('open dashboard and create apiary', async () => {
    await page.goto('/dashboard');
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
    await expect(page.locator('h1.dash-page-title')).toContainText('My Apiaries');

    await page.locator('button.dash-new-btn').click();
    await page.locator('.dash-inline-form input[type="text"]').first().fill(name);
    await page.locator('button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.dash-apiary-card', { hasText: name })).toBeVisible();
  });

  await test.step('navigate into the new apiary', async () => {
    await page.locator('.dash-apiary-card', { hasText: name }).click();
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
    await expect(page.locator('h1.dash-page-title')).toContainText(name);
  });

  await test.step('rename apiary', async () => {
    await page.locator('button.dash-admin-btn', { hasText: 'Edit Apiary' }).click();
    const nameInput = page.locator('.dash-inline-form input[type="text"]').first();
    await nameInput.clear();
    await nameInput.fill(renamed);
    await page.locator('.dash-inline-form button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('h1.dash-page-title')).toContainText(renamed);
  });

  await test.step('delete apiary', async () => {
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Delete Apiary' }).click();
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Confirm Delete' }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    await expect(page.locator('.dash-apiary-card', { hasText: renamed })).not.toBeVisible();
  });
});
