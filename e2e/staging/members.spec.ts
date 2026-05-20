import { test, expect } from '@playwright/test';

// /dashboard/members is gated by memberOnly — admins bypass the gate,
// so these tests use the admin auth state set up in admin.setup.ts.
test.use({ storageState: '.auth/admin.json' });

test('community dashboard: snapshot stat pills render', async ({ page }) => {
  await page.goto('/dashboard/members');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
  await expect(page.locator('h1.dash-page-title')).toContainText('Community', { timeout: 10_000 });

  // Two groups of stat pills: snapshot (apiaries/hives/inspections) and health
  const pills = page.locator('.dash-stat-pill');
  await expect(pills.first()).toBeVisible({ timeout: 10_000 });
  // At least 4 pills (3 snapshot + 1 health avg)
  const count = await pills.count();
  expect(count).toBeGreaterThanOrEqual(4);
});

test('community dashboard: chart boxes render', async ({ page }) => {
  await page.goto('/dashboard/members');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Three chart boxes (mood, city, size) are always rendered in the grid
  const chartBoxes = page.locator('.dash-chart-box');
  await expect(chartBoxes.first()).toBeVisible({ timeout: 10_000 });
  const count = await chartBoxes.count();
  expect(count).toBeGreaterThanOrEqual(3);
});

test('community dashboard: public apiaries table or empty state renders', async ({ page }) => {
  await page.goto('/dashboard/members');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Table or empty state — heading is always present
  await expect(page.locator('h2.dash-section-title').filter({ hasText: /Apiaries|Community/i }).first()).toBeVisible({ timeout: 10_000 });

  // Table or empty state — .last() picks the apiaries section which is always last in DOM
  await expect(page.locator('table.dash-table, p.dash-empty').last()).toBeVisible({ timeout: 10_000 });
});

test('community dashboard: non-supporter is redirected to /dashboard', async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: '.auth/user.json' });
  const page = await ctx.newPage();
  await page.goto('/dashboard/members');
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.locator('h1.dash-page-title')).toContainText('My Apiaries', { timeout: 10_000 });
  await ctx.close();
});
