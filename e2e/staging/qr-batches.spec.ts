import { test, expect } from '@playwright/test';

test('QR batch list renders and a batch can be created and viewed', async ({ page }) => {
  await test.step('navigate to QR batches', async () => {
    await page.goto('/dashboard/qr-batches');
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
    await expect(page.locator('h1.dash-page-title')).toContainText('QR Code Batches');
  });

  await test.step('create a new QR batch', async () => {
    await page.locator('button.dash-new-btn').click();
    await expect(page.locator('.dash-inline-form')).toBeVisible();

    const countInput = page.locator('.dash-inline-form input[type="number"]');
    await countInput.clear();
    await countInput.fill('5');

    await page.locator('.dash-inline-form button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('table.dash-table')).toBeVisible();
  });

  await test.step('navigate into the first batch and download PDF', async () => {
    await page.locator('table.dash-table a.dash-row-btn').first().click();
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
    // Detail page has a "Download PDF" button
    const downloadBtn = page.locator('button.dash-submit-btn', { hasText: /PDF/i });
    await expect(downloadBtn).toBeVisible({ timeout: 10_000 });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadBtn.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
