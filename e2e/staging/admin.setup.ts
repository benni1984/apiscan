import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_FILE = '.auth/admin.json';

setup('authenticate as admin user', async ({ page, request }) => {
  const email = process.env.STAGING_ADMIN_EMAIL ?? 'muellerbenjamin110@gmail.com';
  const password = process.env.STAGING_ADMIN_PASSWORD!;

  // Ensure the admin account exists — no-ops if already registered.
  await request.post('/api/v1/auth/register', {
    data: { email, password, name: 'Admin' },
    failOnStatusCode: false,
  });

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto('/dashboard/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button.dash-submit-btn').click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
