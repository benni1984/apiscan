import { test, expect } from '@playwright/test';

test('custom fields page: create a text field and delete it', async ({ page }) => {
  const tag = Date.now();
  const fieldName = `e2e-field-${tag}`;

  await test.step('navigate to custom fields', async () => {
    await page.goto('/dashboard/field-definitions');
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
    await expect(page.locator('h1.dash-page-title')).toContainText('Custom Fields');
  });

  await test.step('create new text field', async () => {
    await page.locator('button.dash-new-btn').click();
    await expect(page.locator('.dash-inline-form')).toBeVisible();

    await page.locator('.dash-inline-form input[type="text"]').fill(fieldName);
    // Type and target dropdowns default to "text" and "inspection" — leave as-is
    await page.locator('.dash-inline-form button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('td', { hasText: fieldName })).toBeVisible();
  });

  await test.step('delete the custom field', async () => {
    const fieldRow = page.locator('tr', { has: page.locator('td', { hasText: fieldName }) });
    await fieldRow.locator('button.dash-row-btn-danger').click();
    // Confirm deletion
    await fieldRow.locator('button.dash-row-btn-danger').click();
    await expect(page.locator('td', { hasText: fieldName })).not.toBeVisible({ timeout: 10_000 });
  });
});
