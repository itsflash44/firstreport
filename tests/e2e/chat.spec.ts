import { test, expect } from '@playwright/test';

test.describe('Chat Workflow', () => {
  test('should allow user to send message and receive assistant response', async ({ page }) => {
    // Navigate straight to a new case
    const { startNewCase } = require('./helpers');
    await startNewCase(page);
    
    // Wait for the UI to mount and initial AI greeting
    await expect(page.locator('.chat-bubble-ai').first()).toBeVisible({ timeout: 15000 });
    
    // Type and send a message
    const textarea = page.locator('textarea');
    await textarea.fill('This is a test message for chat workflow.');
    
    const sendBtn = page.locator('button[aria-label="Send"], button[aria-label="भेजें"]');
    await sendBtn.click();
    
    // Wait for user bubble to appear
    await expect(page.locator('.chat-bubble-user').last()).toBeVisible({ timeout: 15000 });
    
    // Wait for AI to respond (a second AI bubble should appear)
    await expect(page.locator('.chat-bubble-ai').nth(1)).toBeVisible({ timeout: 15000 });
  });
});
