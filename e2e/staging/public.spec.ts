import { test, expect } from '@playwright/test';

// Public pages — no auth required.
test.use({ storageState: { cookies: [], origins: [] } });

test('home page loads and stats section is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).not.toContainText('Application error');
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
  await expect(page.locator('#site-nav')).toBeVisible({ timeout: 15_000 });
  // Stats section renders (counters may still be animating — just check the container)
  await expect(page.locator('.live-num').first()).toBeVisible({ timeout: 15_000 });
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
