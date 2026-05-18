import { test, expect } from '@playwright/test';

test('apiary stats section renders with live data', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  await page.locator('.dash-apiary-card').first().click();
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Stat pills (hive count, inspection count) should be visible
  await expect(page.locator('.dash-stat-row')).toBeVisible({ timeout: 10_000 });
  const pills = page.locator('.dash-stat-pill');
  await expect(pills.first()).toBeVisible();
});

test('hive stats section renders with varroa trend chart or empty state', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  await page.locator('.dash-apiary-card').first().click();
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  const firstHive = page.locator('.dash-hive-card').first();
  await expect(firstHive).toBeVisible({ timeout: 10_000 });
  await firstHive.click();
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Stats row with inspection count
  await expect(page.locator('.dash-stat-row')).toBeVisible({ timeout: 10_000 });

  // Varroa trend section heading always present
  await expect(page.locator('h2.dash-section-title', { hasText: 'Varroa Trend' })).toBeVisible();
  // Either a chart canvas or the empty-state paragraph should appear
  const chartOrEmpty = page.locator('.dash-chart-box');
  await expect(chartOrEmpty).toBeVisible();
});
