import { test, expect } from '@playwright/test';

test('create, edit, and delete an inspection', async ({ page }) => {
  const tag = Date.now();
  const apiaryName = `e2e-apiary-${tag}`;
  const hiveName = `e2e-hive-${tag}`;

  await test.step('set up: create apiary and hive', async () => {
    await page.goto('/dashboard');
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
    await page.locator('button.dash-new-btn').click();
    await page.locator('.dash-inline-form input[type="text"]').first().fill(apiaryName);
    await page.locator('button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });

    await page.locator('.dash-apiary-card', { hasText: apiaryName }).click();
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

    await page.locator('button.dash-new-btn', { hasText: 'New Hive' }).click();
    await page.locator('.dash-inline-form input[type="text"]').first().fill(hiveName);
    await page.locator('.dash-inline-form button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });

    await page.locator('.dash-hive-card', { hasText: hiveName }).click();
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
  });

  await test.step('create inspection', async () => {
    await page.locator('button.dash-new-btn', { hasText: 'New Inspection' }).click();
    const form = page.locator('.dash-inline-form');
    await expect(form).toBeVisible();
    await expect(form.locator('h2')).toContainText('Log Inspection');

    // Date is pre-filled with today; fill the other fields
    await form.locator('input[type="number"][min="0"]').first().fill('3');        // varroa_count
    await form.locator('select.dash-profile-select').nth(0).selectOption('calm'); // mood
    await form.locator('select.dash-profile-select').nth(1).selectOption('true'); // queen_seen
    await form.locator('input[type="number"][max="10"]').fill('5');               // brood_frames

    await form.locator('button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('table.dash-inspection-table')).toBeVisible();
  });

  await test.step('edit inspection', async () => {
    await page.locator('button.dash-row-btn', { hasText: 'Edit' }).first().click();
    const form = page.locator('.dash-inline-form');
    await expect(form.locator('h2')).toContainText('Edit Inspection');

    // Update varroa count from 3 → 7
    const varroaInput = form.locator('input[type="number"][min="0"]').first();
    await varroaInput.clear();
    await varroaInput.fill('7');

    await form.locator('button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('table.dash-inspection-table td', { hasText: '7' })).toBeVisible();
  });

  await test.step('delete inspection', async () => {
    await page.locator('button.dash-row-btn-danger', { hasText: 'Delete' }).first().click();
    await page.locator('button.dash-row-btn-danger', { hasText: 'Confirm' }).click();
    await expect(page.locator('table.dash-inspection-table')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('p.dash-empty', { hasText: 'No inspections yet' })).toBeVisible();
  });

  await test.step('clean up: delete hive and apiary', async () => {
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Delete Hive' }).click();
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Confirm Delete' }).click();
    await expect(page.locator('h1.dash-page-title')).toContainText(apiaryName, { timeout: 15_000 });

    await page.locator('button.dash-admin-btn-danger', { hasText: 'Delete Apiary' }).click();
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Confirm Delete' }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  });
});
