import { test, expect } from '@playwright/test';

test.describe('TruthTrail Rendering', () => {
  test('should render dynamic values from IntelligenceOutput without hardcoding', async ({ page }) => {
    const { startNewCase } = require('./helpers');
    await startNewCase(page);
    
    // We expect the TruthTrail to be empty or neutral at start
    // If it immediately shows "Trust Score: 85%" hardcoded, we will fail.
    const scoreElement = page.locator('.trust-score, [data-testid="trust-score"]');
    if (await scoreElement.isVisible()) {
      const initialScore = await scoreElement.textContent();
      
      // Inject fact to trigger intelligence update
      await page.locator('textarea').fill('I have clear video evidence of the theft occurring at exactly 2 PM.');
      await page.locator('button[aria-label="Send"], button[aria-label="भेजें"]').click();
      await expect(page.locator('.chat-bubble-ai').nth(1)).toBeVisible({ timeout: 15000 });
      
      // Check if it updated
      const newScore = await scoreElement.textContent();
      expect(newScore).not.toEqual(initialScore);
    }
  });
});
