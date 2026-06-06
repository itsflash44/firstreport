import { test, expect } from '@playwright/test';
import { startNewCase } from './helpers';

test.describe('Case Creation', () => {
  test('should create a new case and persist in history', async ({ page }) => {
    const caseId = await startNewCase(page);
    
    // Verify case persists by going to history
    await page.goto('/history?demo=true');
    const historyItem = page.locator(`a[href*="/case/${caseId}"]`);
    await expect(historyItem).toBeVisible({ timeout: 10000 });
  });
});
