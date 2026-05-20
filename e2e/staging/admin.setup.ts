import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_FILE = '.auth/admin.json';

setup('authenticate as admin user', async ({ page, request }) => {
  const email = process.env.STAGING_ADMIN_EMAIL ?? 'muellerbenjamin110@gmail.com';
  const password = (process.env.STAGING_ADMIN_PASSWORD!).trim();
  const ciToken = process.env.CI_SETUP_TOKEN;

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // If a CI setup token is available, use it to create/reset the admin account
  // so the password always matches the secret regardless of prior DB state.
  if (ciToken) {
    await request.post('/api/v1/auth/ci-setup', {
      data: { email, password, token: ciToken, name: 'Admin' },
      failOnStatusCode: true,
    });
  }

  await page.goto('/dashboard/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button.dash-submit-btn').click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
