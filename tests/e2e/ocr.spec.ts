import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('OCR Pipeline', () => {
  test('should upload an image and extract text', async ({ page }) => {
    const { startNewCase } = require('./helpers');
    await startNewCase(page);
    
    // Wait for the UI to mount and initial AI greeting
    await expect(page.locator('.chat-bubble-ai').first()).toBeVisible({ timeout: 15000 });
    
    // Wait for OCR upload button (the camera icon or attach button)
    const attachBtn = page.locator('button[aria-label="Attach File"], button[aria-label="फ़ाइल संलग्न करें"]');
    await attachBtn.click();
    
    const fileInput = page.locator('input[type="file"]');
    const filePath = path.resolve(__dirname, 'ocr_test_image.png');
    await fileInput.setInputFiles(filePath);
    
    // Verify upload occurs and OCR extraction triggers
    // The user should see extracted text.
    // If the backend fails to extract due to missing API keys or offline fallback,
    // this test will fail, proving the capability is not working in the current environment.
    await expect(page.locator('text=My wallet was stolen at 3 PM').or(page.locator('text=wallet'))).toBeVisible({ timeout: 30000 });
  });
});
