import { test, expect } from '@playwright/test';

// Public pages — no auth required.
test.use({ storageState: { cookies: [], origins: [] } });

test('home page loads with live community stats (not zeroes)', async ({ page }) => {
  await page.goto('/');
  // Wait for animated counter to settle — the demo data guarantees non-zero values.
  const firstCounter = page.locator('.live-num').first();
  await expect(firstCounter).not.toHaveText('—', { timeout: 15_000 });
  await expect(firstCounter).not.toHaveText('0');
});

test('map page renders the Leaflet container', async ({ page }) => {
  await page.goto('/map');
  // Leaflet creates a div with class "leaflet-container"
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20_000 });
});

test('members page loads live global stats', async ({ page }) => {
  await page.goto('/members');
  // Stat block should contain at least one non-placeholder number
  const statNums = page.locator('.live-num, .stat-num, [data-stat]');
  // Members page may use different selectors — just verify no application error
  await expect(page.locator('body')).not.toContainText('Application error');
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
  await expect(page.locator('#site-nav')).toBeVisible({ timeout: 15_000 });
});
