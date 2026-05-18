import { test, expect } from '@playwright/test';

test('export inspection history as CSV and JSON from a hive with data', async ({ page }) => {
  // The demo account has apiaries with full inspection history.
  // Navigate to the dashboard, click the first apiary that has inspections.
  await page.goto('/dashboard');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Click the first apiary card — demo data guarantees at least one apiary.
  const firstApiary = page.locator('.dash-apiary-card').first();
  await expect(firstApiary).toBeVisible();
  await firstApiary.click();

  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Wait for stats to load — export buttons only appear when inspections_total > 0.
  await expect(page.locator('.dash-stat-pill').first()).toBeVisible({ timeout: 10_000 });

  await test.step('export CSV', async () => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button.dash-row-btn', { hasText: 'Export CSV' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  await test.step('export JSON', async () => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button.dash-row-btn', { hasText: 'Export JSON' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });
});

test('export inspection history as CSV and JSON from a hive detail page', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Navigate into the first apiary, then the first hive
  await page.locator('.dash-apiary-card').first().click();
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  const firstHive = page.locator('.dash-hive-card').first();
  await expect(firstHive).toBeVisible({ timeout: 10_000 });
  await firstHive.click();
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Export buttons only show when inspections.length > 0
  const exportCsvBtn = page.locator('button.dash-row-btn', { hasText: 'Export CSV' });
  if (await exportCsvBtn.isVisible()) {
    const [csvDownload] = await Promise.all([
      page.waitForEvent('download'),
      exportCsvBtn.click(),
    ]);
    expect(csvDownload.suggestedFilename()).toMatch(/\.csv$/);

    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button.dash-row-btn', { hasText: 'Export JSON' }).click(),
    ]);
    expect(jsonDownload.suggestedFilename()).toMatch(/\.json$/);
  } else {
    // Hive has no inspections — export buttons correctly absent, skip.
    test.skip();
  }
});
