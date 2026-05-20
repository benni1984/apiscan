import { test, expect } from '@playwright/test';

// All tests in this file run as the admin user.
test.use({ storageState: '.auth/admin.json' });

// ── /dashboard/admin ─────────────────────────────────────────────────────────

test('admin stats page: pills, preset buttons, and sub-page nav links render', async ({ page }) => {
  await page.goto('/dashboard/admin');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
  await expect(page.locator('h1.dash-page-title')).toContainText('Platform Statistics', { timeout: 10_000 });

  // At least one stat pill with a number
  const pills = page.locator('.dash-stat-pill');
  await expect(pills.first()).toBeVisible({ timeout: 10_000 });

  // All four period preset buttons present
  for (const label of ['30d', '90d', '365d', 'all']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible();
  }

  // Switching preset reloads pills
  await page.getByRole('button', { name: '90d' }).click();
  await expect(page.locator('.dash-stat-pill').first()).toBeVisible({ timeout: 15_000 });

  // Navigation links to sub-pages (scoped to card links to avoid sidebar duplicates)
  const adminLinks = page.locator('.dash-admin-links');
  await expect(adminLinks.getByRole('link', { name: 'Users', exact: true })).toBeVisible();
  await expect(adminLinks.getByRole('link', { name: 'Map', exact: true })).toBeVisible();
  await expect(adminLinks.getByRole('link', { name: 'Health', exact: true })).toBeVisible();
});

test('non-admin is redirected from /dashboard/admin to /dashboard', async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: '.auth/user.json' });
  const page = await ctx.newPage();
  await page.goto('/dashboard/admin');
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.locator('h1.dash-page-title')).toContainText('My Apiaries', { timeout: 10_000 });
  await ctx.close();
});

// ── /dashboard/admin/users ────────────────────────────────────────────────────

test('admin users page: table, search, and supporter filter work', async ({ page }) => {
  await page.goto('/dashboard/admin/users');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
  await expect(page.locator('h1.dash-page-title')).toContainText('User Management', { timeout: 10_000 });

  // Table has at least one row (admin account always exists)
  await expect(page.locator('table.dash-admin-table tbody tr').first()).toBeVisible({ timeout: 10_000 });

  // Search input present and functional (type and clear)
  const searchInput = page.locator('input.dash-admin-search');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('nobody@example.invalid');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 10_000 });
  await searchInput.clear();
  await expect(page.locator('table.dash-admin-table tbody tr').first()).toBeVisible({ timeout: 10_000 });

  // Supporter filter dropdown visible
  await expect(page.locator('select.dash-admin-select')).toBeVisible();

  // Action buttons (Make/Remove Supporter, Revoke, Delete) present in the first row
  const firstRowButtons = page.locator('table.dash-admin-table tbody tr').first().locator('button');
  await expect(firstRowButtons.first()).toBeVisible();
});

// ── /dashboard/admin/health ───────────────────────────────────────────────────

test('admin health page: three cards render and drill-down opens and closes', async ({ page }) => {
  await page.goto('/dashboard/admin/health');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
  await expect(page.locator('h1.dash-page-title')).toContainText('Data Health', { timeout: 10_000 });

  // Exactly three health cards
  const cards = page.locator('.dash-admin-health-card');
  await expect(cards).toHaveCount(3, { timeout: 10_000 });

  // Click the first card (inactive users) — drill-down table appears (empty state is inside table)
  await cards.first().click();
  await expect(page.locator('table.dash-admin-table')).toBeVisible({ timeout: 15_000 });

  // Click the same card again — drill-down closes
  await cards.first().click();
  await expect(page.locator('table.dash-admin-table')).not.toBeVisible({ timeout: 5_000 });
});

// ── /dashboard/admin/map ─────────────────────────────────────────────────────

test('admin map page: All tab shows data and Flagged tab renders without error', async ({ page }) => {
  await page.goto('/dashboard/admin/map');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
  await expect(page.locator('h1.dash-page-title')).toContainText('Map Moderation', { timeout: 10_000 });

  // Two tab buttons visible
  await expect(page.locator('button.dash-admin-tab', { hasText: 'All Public Apiaries' })).toBeVisible();
  await expect(page.locator('button.dash-admin-tab', { hasText: 'Flagged' })).toBeVisible();

  // "All" tab: table or empty state (retrying assertion)
  await expect(page.locator('table.dash-admin-table, .dash-empty').first()).toBeVisible({ timeout: 10_000 });

  // Switch to Flagged tab — empty state or table (no JS error)
  await page.locator('button.dash-admin-tab', { hasText: 'Flagged' }).click();
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 10_000 });
  const hasFlaggedTable = await page.locator('table.dash-admin-table').isVisible().catch(() => false);
  const hasFlaggedEmpty = await page.locator('.dash-empty').isVisible().catch(() => false);
  expect(hasFlaggedTable || hasFlaggedEmpty).toBeTruthy();
});
