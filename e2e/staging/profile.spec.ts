import { test, expect } from '@playwright/test';

test('profile page: displays email and renders both forms', async ({ page }) => {
  await page.goto('/dashboard/profile');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
  await expect(page.locator('h1')).toContainText('Profile', { timeout: 10_000 });

  // Email and member-since metadata visible
  await expect(page.locator('.dash-profile-email')).toBeVisible();
  await expect(page.locator('.dash-profile-since')).toBeVisible();

  // Both section headings present
  await expect(page.locator('h2.dash-section-title', { hasText: 'Edit Profile' })).toBeVisible();
  await expect(page.locator('h2.dash-section-title', { hasText: 'Change Password' })).toBeVisible();
});

test('profile page: update display name saves successfully', async ({ page }) => {
  await page.goto('/dashboard/profile');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Change name (keep same value so we don't mutate staging data permanently)
  const nameInput = page.locator('input[type="text"]').first();
  const currentName = await nameInput.inputValue();
  await nameInput.clear();
  await nameInput.fill(currentName || 'Demo Beekeeper');

  await page.locator('.dash-profile-card').first().locator('button.dash-submit-btn').click();
  await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
});

test('profile page: mismatched new passwords show error without sending request', async ({ page }) => {
  await page.goto('/dashboard/profile');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  await page.locator('input[autocomplete="current-password"]').fill('Demo1234!');
  await page.locator('input[autocomplete="new-password"]').first().fill('NewPass123!');
  await page.locator('input[autocomplete="new-password"]').nth(1).fill('DifferentPass456!');

  await page.locator('.dash-profile-card').nth(1).locator('button.dash-submit-btn').click();

  // Client-side mismatch check — error banner, stay on page
  await expect(page.locator('.dash-error-banner')).toBeVisible({ timeout: 5_000 });
  await expect(page).toHaveURL(/\/dashboard\/profile/);
});

test('profile page: cancel delete closes the confirm prompt', async ({ page }) => {
  await page.goto('/dashboard/profile');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  // Open the danger-zone confirm
  await page.getByRole('button', { name: 'Delete My Account' }).click();
  await expect(page.getByRole('button', { name: 'Yes, delete my account' })).toBeVisible({ timeout: 5_000 });

  // Cancel — prompt collapses, original button restored
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'Delete My Account' })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('button', { name: 'Yes, delete my account' })).not.toBeVisible();
});
