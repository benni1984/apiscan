import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_FILE = '.auth/admin.json';

setup('authenticate as admin user', async ({ page, request }) => {
  const email = process.env.STAGING_ADMIN_EMAIL ?? 'muellerbenjamin110@gmail.com';
  const password = (process.env.STAGING_ADMIN_PASSWORD!).trim();

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // Attempt 1: try login directly (account already exists with correct password)
  await page.goto('/dashboard/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button.dash-submit-btn').click();
  const loggedIn = await page.waitForURL(/\/dashboard$/, { timeout: 5_000 }).then(() => true).catch(() => false);
  if (loggedIn) {
    await page.context().storageState({ path: AUTH_FILE });
    return;
  }

  // Login failed — try register (no-ops if account already exists)
  await request.post('/api/v1/auth/register', {
    data: { email, password, name: 'Admin' },
    failOnStatusCode: false,
  });

  // Attempt 2: login after potential registration
  await page.goto('/dashboard/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button.dash-submit-btn').click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
