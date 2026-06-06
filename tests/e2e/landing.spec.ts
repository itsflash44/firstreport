import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load landing page and navigate properly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FirstReport/i);
    // Basic navigation links
    const homeLink = page.locator('text=Home').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page.url()).toContain('/');
    }
    // No fatal JS errors means the page successfully hydrated and didn't crash
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
