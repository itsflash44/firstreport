import { test, expect } from '@playwright/test';

test.describe('Persistence', () => {
  test('should persist case data across browser contexts', async ({ browser }) => {
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    // Create case
    const { startNewCase } = require('./helpers');
    await startNewCase(page1);
    await expect(page1.locator('.chat-bubble-ai').first()).toBeVisible({ timeout: 15000 });
    
    const caseUrl = page1.url();
    
    // Send message
    await page1.locator('textarea').fill('This is a test message to be persisted.');
    await page1.locator('button[aria-label="Send"], button[aria-label="भेजें"]').click();
    await expect(page1.locator('.chat-bubble-user').last()).toBeVisible({ timeout: 15000 });
    
    // Refresh
    await page1.reload();
    await expect(page1.locator('.chat-bubble-user').last()).toBeVisible({ timeout: 15000 });
    
    // Test context isolation requires localStorage to be saved manually since 
    // Playwright creates fresh ephemeral contexts.
    // However, the test requirement asks to "Close browser context, open new context, navigate to saved case".
    // If it relies on `localStorage`, closing the context WIPES `localStorage`!
    // UNLESS the case is saved to the Supabase backend!
    // Let's test if it survived in a new context. If it fails, that means we lack DB persistence.
    
    await context1.close();
    
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(caseUrl);
    
    // Does the chat bubble still exist?
    // In an offline-only scenario, it will redirect to history or be empty.
    const userBubble = page2.locator('.chat-bubble-user').last();
    // Use a soft assertion or wait to see what happens.
    // The requirement says "Verify case persists".
    await expect(userBubble).toBeVisible({ timeout: 10000 });
  });
});
