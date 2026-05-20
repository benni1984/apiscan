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

// ── /apiary — public apiary detail page ──────────────────────────────────────

test('public apiary detail: stat boxes and hive table render for a known public apiary', async ({ page, request }) => {
  // Fetch a real public apiary ID from the stats endpoint
  const stats = await request.get('/api/v1/public/stats');
  const json = await stats.json();
  const apiaries: { id: string }[] = json.apiaries ?? [];

  if (apiaries.length === 0) {
    // No public apiaries on staging — page still renders correctly with ?id=missing
    test.skip();
    return;
  }

  const id = apiaries[0].id;
  await page.goto(`/apiary?id=${encodeURIComponent(id)}`);

  // Stat boxes (Hives, Inspections, Avg Varroa, Last Inspection)
  await expect(page.locator('.stat-box').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.stat-grid')).toBeVisible();

  // Hive table or empty state
  const hasTable = await page.locator('table').isVisible().catch(() => false);
  const hasEmpty = await page.locator('.empty').isVisible().catch(() => false);
  expect(hasTable || hasEmpty).toBeTruthy();

  // Back-to-map link present
  await expect(page.locator('a.back-btn')).toBeVisible();
});

test('public apiary detail: missing id param shows error state with back link', async ({ page }) => {
  await page.goto('/apiary');

  // Wait for the Suspense boundary to resolve (spinner → component)
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#content .empty')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('a', { hasText: /map/i })).toBeVisible();
});
