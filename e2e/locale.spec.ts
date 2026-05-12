import { test, expect } from '@playwright/test';

const STATS_MOCK = {
  apiary_count: 42,
  hive_count: 250,
  inspection_count: 1500,
  apiaries: [],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/public/stats', route =>
    route.fulfill({ json: STATS_MOCK })
  );
});

// ── Default locale ────────────────────────────────────────────────────────────

test('home page renders in English by default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#nav-links').getByRole('link', { name: 'Live Map' })).toBeVisible();
});

// ── Direct locale URLs ────────────────────────────────────────────────────────

test('visiting /de serves German content', async ({ page }) => {
  await page.goto('/de');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#nav-links').getByRole('link', { name: 'Live-Karte' })).toBeVisible();
});

test('visiting /fr serves French content', async ({ page }) => {
  await page.goto('/fr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});

test('visiting /es serves Spanish content', async ({ page }) => {
  await page.goto('/es');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

// ── Language switcher ─────────────────────────────────────────────────────────

test('switching language updates URL and page content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#nav-links').getByRole('link', { name: 'Live Map' })).toBeVisible();

  await page.getByLabel('Switch language').click();
  await page.getByText('🇩🇪 Deutsch').click();

  await expect(page).toHaveURL('/de');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#nav-links').getByRole('link', { name: 'Live-Karte' })).toBeVisible();
});

// ── Edge cases ────────────────────────────────────────────────────────────────

test('unknown locale path returns 404', async ({ page }) => {
  const response = await page.goto('/xx');
  expect(response?.status()).toBe(404);
});

test('/map.html redirects to /map', async ({ page }) => {
  await page.goto('/map.html');
  await expect(page).toHaveURL(/\/map$/);
});
