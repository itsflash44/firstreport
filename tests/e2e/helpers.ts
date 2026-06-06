import { Page, expect } from '@playwright/test';

export async function startNewCase(page: Page): Promise<string> {
  await page.goto('/home?lang=en-IN&demo=true');
  const startBtn = page.locator('button:has-text("Start")').first();
  await startBtn.click();
  
  await page.waitForURL(/\/(case|login)/, { timeout: 15000 });
  let currentUrl = page.url();
  let caseId = '';
  
  if (currentUrl.includes('/login')) {
    const urlObj = new URL(currentUrl);
    const redirectPath = urlObj.searchParams.get('redirect');
    if (redirectPath && redirectPath.includes('/case/')) {
      caseId = redirectPath.split('/case/')[1].split('?')[0];
      await page.goto(`/case/${caseId}?demo=true`);
    } else {
      throw new Error('Redirected to login but no case ID found in redirect param.');
    }
  } else {
    const match = currentUrl.match(/\/case\/([^?]+)/);
    caseId = match![1];
  }
  
  await expect(page).toHaveURL(/\/case\/.+/);
  return caseId;
}
