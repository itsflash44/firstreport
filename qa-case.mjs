import puppeteer from 'puppeteer';

async function runQACase() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`PAGE ERROR: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => {
    console.error(`RUNTIME ERROR: ${err.message}`);
  });

  try {
    await page.goto('http://localhost:3000/case/123', { waitUntil: 'networkidle0' });
    console.log("Case page loaded.");
    // wait a bit for engines to run
    await new Promise(r => setTimeout(r, 2000));
    console.log("Waited 2s");
  } catch (e) {
    console.error(e.message);
  }

  await browser.close();
}

runQACase().catch(console.error);
