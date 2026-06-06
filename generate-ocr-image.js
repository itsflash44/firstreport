const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<div style="font-size:48px; background:white; padding:20px;">My wallet was stolen at 3 PM.</div>');
  await page.screenshot({ path: 'tests/e2e/ocr_test_image.png' });
  await browser.close();
})();
