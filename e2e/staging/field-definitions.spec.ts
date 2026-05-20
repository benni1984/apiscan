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
    // Row replaced by a confirm row — click the confirm button there
    await page.locator('tr.dash-confirm-row').locator('button.dash-row-btn-danger').click();
    await expect(page.locator('td', { hasText: fieldName })).not.toBeVisible({ timeout: 10_000 });
  });
});

test('custom fields page: edit an existing field name and save', async ({ page }) => {
  const tag = Date.now();
  const fieldName = `e2e-field-${tag}`;
  const renamedField = `e2e-field-${tag}-edited`;

  await test.step('create a field to edit', async () => {
    await page.goto('/dashboard/field-definitions');
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

    await page.locator('button.dash-new-btn').click();
    await page.locator('.dash-inline-form input[type="text"]').fill(fieldName);
    await page.locator('.dash-inline-form button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('td', { hasText: fieldName })).toBeVisible();
  });

  await test.step('open edit row and rename the field', async () => {
    const fieldRow = page.locator('tr', { has: page.locator('td', { hasText: fieldName }) });
    await fieldRow.locator('button.dash-row-btn', { hasText: 'Edit' }).click();

    // Inline edit row replaces the display row
    const editRow = page.locator('tr.dash-edit-row');
    await expect(editRow).toBeVisible({ timeout: 5_000 });

    const nameInput = editRow.locator('input[type="text"]');
    await nameInput.clear();
    await nameInput.fill(renamedField);

    await editRow.locator('button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('td', { hasText: renamedField })).toBeVisible();
    await expect(page.locator('td', { hasText: fieldName })).not.toBeVisible();
  });

  await test.step('clean up — delete the renamed field', async () => {
    const renamedRow = page.locator('tr', { has: page.locator('td', { hasText: renamedField }) });
    await renamedRow.locator('button.dash-row-btn-danger').click();
    await page.locator('tr.dash-confirm-row').locator('button.dash-row-btn-danger').click();
    await expect(page.locator('td', { hasText: renamedField })).not.toBeVisible({ timeout: 10_000 });
  });
});
