import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/home?demo=true');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/Users/flash/Desktop/firstReport/Home_Demo.png' });
  
  await browser.close();
})();
