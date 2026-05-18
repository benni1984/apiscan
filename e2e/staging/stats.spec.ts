import { test, expect } from '@playwright/test';

// ── /dashboard/members — community dashboard gate ────────────────────────────

test('community dashboard redirects non-supporter demo user to /dashboard', async ({ page }) => {
  // The demo account is a regular user (not a supporter/admin).
  // Visiting /dashboard/members should redirect back to the apiaries page.
  await page.goto('/dashboard/members');
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.locator('h1.dash-page-title')).toContainText('My Apiaries', { timeout: 10_000 });
});

// ── /members login gate (anonymous) ─────────────────────────────────────────

test('members page shows login gate and blurred stats for anonymous visitor', async ({ browser }) => {
  // Use a fresh context with no storage state so the demo auth is not present.
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();

  await page.goto('/members');

  // Login gate heading visible
  await expect(page.getByText('Log in to see live statistics')).toBeVisible({ timeout: 10_000 });

  // Login link goes to the dashboard login page
  const loginLink = page.getByRole('link', { name: 'Log in' });
  await expect(loginLink).toBeVisible();
  await expect(loginLink).toHaveAttribute('href', /\/dashboard\/login/);

  // Stats preview is blurred (inline style set by MembersTeaser)
  const preview = page.locator('.members-preview');
  await expect(preview).toBeVisible({ timeout: 10_000 });
  await expect(preview).toHaveCSS('filter', /blur/);

  await ctx.close();
});

// ── /members logged-in view (demo account) ──────────────────────────────────

test('members page shows unblurred stats for logged-in user', async ({ page }) => {
  // storageState from auth.setup.ts is already active for this project.
  await page.goto('/members');

  // Stats preview must NOT be blurred
  const preview = page.locator('.members-preview');
  await expect(preview).toBeVisible({ timeout: 15_000 });
  // filter is either '' (empty string) or not blur when logged in
  const filter = await preview.evaluate(el => (el as HTMLElement).style.filter);
  expect(filter).not.toMatch(/blur/);

  // Either the supporter gate or the unlocked badge is visible — never the login gate
  const hasSupporter = await page.getByText('Unlock the full picture').isVisible().catch(() => false);
  const hasUnlocked = await page.locator('.members-unlocked').isVisible().catch(() => false);
  expect(hasSupporter || hasUnlocked).toBeTruthy();

  // Login gate must NOT appear
  await expect(page.getByText('Log in to see live statistics')).not.toBeVisible();
});

// ── /dashboard/stats ─────────────────────────────────────────────────────────

test('My Statistics page shows summary pills and per-apiary table', async ({ page }) => {
  await page.goto('/dashboard/stats');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Page title
  await expect(page.locator('h1.dash-page-title')).toHaveText('My Statistics', { timeout: 10_000 });

  // Three summary pills (apiaries, hives, inspections)
  const pills = page.locator('.dash-stat-pill');
  await expect(pills).toHaveCount(3, { timeout: 10_000 });
  await expect(pills.nth(0)).toBeVisible();
  await expect(pills.nth(1)).toBeVisible();
  await expect(pills.nth(2)).toBeVisible();

  // Per-apiary table or empty state must be present
  const hasTable = await page.locator('.dash-table').isVisible().catch(() => false);
  const hasEmpty = await page.locator('.dash-empty').isVisible().catch(() => false);
  expect(hasTable || hasEmpty).toBeTruthy();
});

test('My Statistics preset buttons change the period', async ({ page }) => {
  await page.goto('/dashboard/stats');
  await expect(page.locator('h1.dash-page-title')).toBeVisible({ timeout: 15_000 });

  // All four preset buttons should be visible
  await expect(page.getByRole('button', { name: 'Last 30 days' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Last 90 days' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Last year' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'All time' })).toBeVisible();

  // Click 30d — spinner appears then summary pills return
  await page.getByRole('button', { name: 'Last 30 days' }).click();
  await expect(page.locator('.dash-stat-pill').first()).toBeVisible({ timeout: 15_000 });
});

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
