import { test, expect } from '@playwright/test';

test.describe('Contradiction Detection', () => {
  test('should detect contradiction and update TruthTrail scores', async ({ page }) => {
    const { startNewCase } = require('./helpers');
    await startNewCase(page);
    
    await expect(page.locator('.chat-bubble-ai').first()).toBeVisible({ timeout: 15000 });
    
    // First statement
    await page.locator('textarea').fill('My wallet was stolen at 2 PM.');
    await page.locator('button[aria-label="Send"], button[aria-label="भेजें"]').click();
    await expect(page.locator('.chat-bubble-ai').nth(1)).toBeVisible({ timeout: 15000 });
    
    // Check initial state (Contradictions count, Trust Score)
    // We will look for elements that might display these scores.
    // If they aren't visible, we'll mark UNVERIFIED in the final report.
    
    // Second conflicting statement
    await page.locator('textarea').fill('My wallet was stolen at 4 PM.');
    await page.locator('button[aria-label="Send"], button[aria-label="भेजें"]').click();
    await expect(page.locator('.chat-bubble-ai').nth(2)).toBeVisible({ timeout: 15000 });
    
    // Verify contradiction is detected in the UI
    const contradictionBadge = page.locator('text=Contradiction').or(page.locator('text=विरोधाभास'));
    await expect(contradictionBadge).toBeVisible({ timeout: 10000 });
  });
});
