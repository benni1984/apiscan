import { test as setup, expect } from '@playwright/test';

const AUTH_FILE = '.auth/user.json';

setup('authenticate as demo user', async ({ page }) => {
  const email = process.env.STAGING_DEMO_EMAIL ?? 'demo@apiscan.dev';
  const password = process.env.STAGING_DEMO_PASSWORD ?? 'Demo1234!';

  await page.goto('/dashboard/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button.dash-submit-btn').click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
