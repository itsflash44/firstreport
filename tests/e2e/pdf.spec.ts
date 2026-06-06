import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// pdf-parse needs to be required this way usually
const pdfParse = require('pdf-parse');

test.describe('PDF Generation', () => {
  test('should generate, download, and extract text from PDF', async ({ page }) => {
    const { startNewCase } = require('./helpers');
    await startNewCase(page);
    
    await expect(page.locator('.chat-bubble-ai').first()).toBeVisible({ timeout: 15000 });
    
    // Inject magic trigger for document generation
    await page.locator('textarea').fill('Please generate documents. [ACTION:GENERATE_DOCS]');
    await page.locator('button[aria-label="Send"], button[aria-label="भेजें"]').click();
    
    // Wait for the generate button to appear
    const generateBtn = page.locator('button:has-text("Generate Documents"), button:has-text("दस्तावेज़ बनाएँ")').first();
    await expect(generateBtn).toBeVisible({ timeout: 15000 });
    
    // Intercept download
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await generateBtn.click();
    
    const download = await downloadPromise;
    expect(download).toBeTruthy();
    
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Verify PDF can be parsed
    const dataBuffer = fs.readFileSync(downloadPath!);
    const data = await pdfParse(dataBuffer);
    
    expect(data.text).toBeTruthy();
    expect(data.text.length).toBeGreaterThan(0);
    // Ideally we would check for specific case content if we had provided name/address, 
    // but right now just ensuring the PDF isn't empty/corrupted is enough.
  });
});
