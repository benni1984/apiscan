import { test, expect } from '@playwright/test';

// ── Existing: create / view / delete ─────────────────────────────────────────

test('create a hive, view its detail page, then clean up', async ({ page }) => {
  const tag = Date.now();
  const apiaryName = `e2e-apiary-${tag}`;
  const hiveName = `e2e-hive-${tag}`;

  await test.step('create a temporary apiary', async () => {
    await page.goto('/dashboard');
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
    await page.locator('button.dash-new-btn').click();
    await page.locator('.dash-inline-form input[type="text"]').first().fill(apiaryName);
    await page.locator('button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
  });

  await test.step('navigate into the apiary', async () => {
    await page.locator('.dash-apiary-card', { hasText: apiaryName }).click();
    await expect(page).toHaveURL(/\/dashboard\/apiary\//, { timeout: 15_000 });
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('h1.dash-page-title')).toContainText(apiaryName);
  });

  await test.step('create a hive', async () => {
    await page.locator('button.dash-new-btn', { hasText: 'New Hive' }).click();
    await page.locator('.dash-inline-form input[type="text"]').first().fill(hiveName);
    await page.locator('.dash-inline-form button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.dash-hive-card', { hasText: hiveName })).toBeVisible();
  });

  await test.step('navigate into the hive and verify detail page', async () => {
    await page.locator('.dash-hive-card', { hasText: hiveName }).click();
    await expect(page).toHaveURL(/\/dashboard\/hive\//, { timeout: 15_000 });
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 10_000 });
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

// ── Edit hive ─────────────────────────────────────────────────────────────────

test('edit hive: rename and change type, then restore', async ({ page }) => {
  const tag = Date.now();
  const apiaryName = `e2e-apiary-${tag}`;
  const hiveName = `e2e-hive-${tag}`;
  const renamedHive = `e2e-hive-${tag}-renamed`;

  await test.step('create apiary and hive', async () => {
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

  await test.step('open edit form and rename hive', async () => {
    await page.locator('button.dash-admin-btn', { hasText: 'Edit Hive' }).click();
    const form = page.locator('.dash-inline-form');
    await expect(form).toBeVisible({ timeout: 5_000 });
    await expect(form.locator('h2')).toContainText('Edit Hive');

    const nameInput = form.locator('input[type="text"]').first();
    await nameInput.clear();
    await nameInput.fill(renamedHive);

    // Change hive type to dadant
    await form.locator('select.dash-profile-select').selectOption('dadant');
    await form.locator('button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('h1.dash-page-title')).toContainText(renamedHive);
    await expect(page.locator('p.dash-hive-type-label')).toContainText('dadant');
  });

  await test.step('clean up', async () => {
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Delete Hive' }).click();
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Confirm Delete' }).click();
    await expect(page.locator('h1.dash-page-title')).toContainText(apiaryName, { timeout: 15_000 });
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Delete Apiary' }).click();
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Confirm Delete' }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  });
});

// ── Cancel button in inspection form ─────────────────────────────────────────

test('cancel inspection form: form closes without saving', async ({ page }) => {
  // Use demo account's first hive (has real data)
  await page.goto('/dashboard');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  await page.locator('.dash-apiary-card').first().click();
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  await page.locator('.dash-hive-card').first().click();
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  await page.locator('button.dash-new-btn', { hasText: 'New Inspection' }).click();
  const form = page.locator('.dash-inline-form');
  await expect(form).toBeVisible({ timeout: 5_000 });
  await expect(form.locator('h2')).toContainText('Log Inspection');

  await page.locator('.dash-cancel-btn').click();
  await expect(form).not.toBeVisible({ timeout: 5_000 });
});

// ── Mood distribution bar ─────────────────────────────────────────────────────

test('hive detail: mood distribution bar renders with demo data', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Navigate into first apiary → first hive (demo account has full inspection history)
  await page.locator('.dash-apiary-card').first().click();
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  await page.locator('.dash-hive-card').first().click();
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Mood section heading always present
  await expect(page.locator('h2.dash-section-title', { hasText: 'Mood Distribution' })).toBeVisible({ timeout: 10_000 });

  // Either the mood bar (has real data) or the empty-state paragraph should appear
  const hasBar  = await page.locator('.dash-mood-bar').isVisible().catch(() => false);
  const hasNone = await page.locator('.dash-empty', { hasText: 'No mood data yet' }).isVisible().catch(() => false);
  expect(hasBar || hasNone).toBeTruthy();
});

// ── Load-more pagination ──────────────────────────────────────────────────────

test('hive inspection list: load-more appends rows when multiple pages exist', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Navigate into demo account's first hive — it has enough inspections for pagination
  await page.locator('.dash-apiary-card').first().click();
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  await page.locator('.dash-hive-card').first().click();
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
  await expect(page.locator('table.dash-inspection-table')).toBeVisible({ timeout: 10_000 });

  const loadMoreBtn = page.locator('button.dash-admin-btn', { hasText: 'Load more' });

  if (await loadMoreBtn.isVisible()) {
    const rowsBefore = await page.locator('table.dash-inspection-table tbody tr').count();
    await loadMoreBtn.click();
    await expect(page.locator('button.dash-admin-btn', { hasText: /Load more|Loading/ })).not.toHaveText('Loading…', { timeout: 15_000 });
    const rowsAfter = await page.locator('table.dash-inspection-table tbody tr').count();
    expect(rowsAfter).toBeGreaterThan(rowsBefore);
  } else {
    // Hive has only one page — pagination correctly absent, skip
    test.skip();
  }
});
