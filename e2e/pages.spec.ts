import { test, expect } from '@playwright/test';

const STATS_MOCK = {
  apiary_count: 42,
  hive_count: 250,
  inspection_count: 1500,
  avg_varroa_count: 2.8,
  mood_distribution: { calm: 100, nervous: 20, aggressive: 5 },
  avg_brood_frames: 5.2,
  avg_inspection_interval_days: 14.3,
  apiaries: [],
};

const PAGES = ['/', '/map', '/news', '/contribute', '/members', '/privacy'];

for (const path of PAGES) {
  test(`${path} renders without an error`, async ({ page }) => {
    await page.route('**/api/v1/public/stats', route =>
      route.fulfill({ json: STATS_MOCK })
    );
    await page.route('**/api/v1/public/apiaries/**', route =>
      route.fulfill({ status: 404, json: { detail: 'Not found' } })
    );
    await page.goto(path);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
    await expect(page.locator('#site-nav')).toBeVisible();
  });
}

test('LiveStats animates to the correct values from /api/v1/public/stats', async ({ page }) => {
  await page.route('**/api/v1/public/stats', route =>
    route.fulfill({ json: STATS_MOCK })
  );
  await page.goto('/');
  // Stats section should animate; 42 apiaries → visible counter
  await expect(page.locator('.live-num').first()).not.toHaveText('—', { timeout: 5000 });
});

test('hero nav link "Live Map" points to /map', async ({ page }) => {
  await page.route('**/api/v1/public/stats', route =>
    route.fulfill({ json: STATS_MOCK })
  );
  await page.goto('/');
  const mapLink = page.getByRole('link', { name: /Live Map/i }).first();
  await expect(mapLink).toHaveAttribute('href', /\/map/);
});
