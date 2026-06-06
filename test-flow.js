const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/home?demo=true');
  console.log("Navigated to home");
  await page.locator('text=English').first().click();
  console.log("Clicked English");
  await page.locator('text=Standard').first().click();
  console.log("Clicked Standard");
  await page.locator('text=Routine').first().click();
  console.log("Clicked Routine");
  const startBtn = page.locator('button', { hasText: 'Start' }).first();
  await startBtn.click();
  console.log("Clicked Start");
  await page.waitForURL(/\/case\//, { timeout: 5000 });
  console.log("URL is now:", page.url());
  await browser.close();
})();
