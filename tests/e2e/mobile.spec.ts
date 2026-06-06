import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 12'] });

test.describe('Mobile Responsiveness', () => {

  test('should render properly on mobile viewport', async ({ page }) => {
    await page.goto('/?demo=true');
    await expect(page.locator('text=Start New Case').or(page.locator('text=नया केस शुरू करें'))).toBeVisible();
    
    // Take a screenshot of the landing page
    await page.screenshot({ path: 'screenshots/mobile-landing.png' });
    
    await page.locator('text=Start New Case').or(page.locator('text=नया केस शुरू करें')).click();
    await page.locator('text=Theft & Property').or(page.locator('text=चोरी और संपत्ति')).click();
    
    await expect(page.locator('.chat-bubble-ai').first()).toBeVisible({ timeout: 15000 });
    
    // Take a screenshot of the chat page
    await page.screenshot({ path: 'screenshots/mobile-chat.png' });
    
    // No fatal UI breakage means the page is still interactive
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
  });
});
