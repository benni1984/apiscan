import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/public/stats', route =>
    route.fulfill({ json: { apiary_count: 0, hive_count: 0, inspection_count: 0, apiaries: [] } })
  );
});

test('mobile menu toggle opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const navLinks = page.locator('#nav-links');
  await expect(navLinks).not.toHaveClass(/open/);
  await page.getByLabel('Open menu').click();
  await expect(navLinks).toHaveClass(/open/);
  await page.getByLabel('Open menu').click();
  await expect(navLinks).not.toHaveClass(/open/);
});

test('language dropdown closes on outside click', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Switch language').click();
  await expect(page.getByText('🇩🇪 Deutsch')).toBeVisible();
  // Click on the hero area (far from the dropdown)
  await page.locator('body').click({ position: { x: 10, y: 400 } });
  await expect(page.getByText('🇩🇪 Deutsch')).not.toBeVisible();
});

test('nav bar is visible on all inner pages', async ({ page }) => {
  for (const path of ['/news', '/contribute', '/members', '/map']) {
    await page.goto(path);
    await expect(page.locator('#site-nav')).toBeVisible();
  }
});
