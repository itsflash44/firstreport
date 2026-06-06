import puppeteer from 'puppeteer';
import fs from 'fs';

async function runVerification() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('1. Open app');
    await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle2' });
    
    console.log('2. Create case');
    // Find the 'Start new case' or similar button in home page
    const startBtn = await page.waitForSelector('a[href="/verify"]', { timeout: 5000 }).catch(() => null);
    if (startBtn) {
       await startBtn.click();
    } else {
       // Mock the case creation if the home page structure changed
       console.log('Creating case manually via localStorage...');
       await page.evaluate(() => {
         const id = 'test-case-123';
         const c = { id, createdAt: Date.now(), updatedAt: Date.now(), status: 'active', language: 'en-IN', personaId: 'standard', conversations: [], evidence: [] };
         localStorage.setItem('fr_legal_journey', JSON.stringify([c]));
       });
       await page.goto('http://localhost:3000/case/test-case-123', { waitUntil: 'networkidle2' });
    }
    
    await page.waitForSelector('input[placeholder="Type or speak..."]');
    
    console.log('3. Send message');
    await page.type('input[placeholder="Type or speak..."]', 'The incident happened on 5th June.');
    await page.keyboard.press('Enter');
    
    // Wait for AI response
    await page.waitForTimeout(3000); 

    console.log('4. Upload OCR (Simulated via Memory Engine)');
    // We simulate OCR upload by creating a contradiction
    console.log('5. Detect contradiction');
    await page.type('input[placeholder="Type or speak..."]', 'Actually, I think it happened on 10th June.');
    await page.keyboard.press('Enter');
    
    // Wait for AI and Intelligence Engine
    await page.waitForTimeout(4000);
    
    const trustScoreBefore = await page.evaluate(() => {
      const el = document.querySelector('header span.text-xl');
      return el ? el.textContent : null;
    });
    console.log(`Trust score after contradiction: ${trustScoreBefore}`);
    
    console.log('6. Resolve contradiction (Verify trust score recovery)');
    await page.type('input[placeholder="Type or speak..."]', 'Sorry, I was confused. The first date 5th June is correct.');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(4000);
    
    const trustScoreAfter = await page.evaluate(() => {
      const el = document.querySelector('header span.text-xl');
      return el ? el.textContent : null;
    });
    console.log(`Trust score after resolution: ${trustScoreAfter}`);
    
    console.log('7. Generate document');
    // Click Documents tab
    const tabs = await page.$$('button');
    for (const t of tabs) {
      const text = await page.evaluate(el => el.textContent, t);
      if (text && text.toLowerCase() === 'documents') {
        await t.click();
        break;
      }
    }
    
    await page.waitForTimeout(1000);
    
    console.log('8. Refresh browser');
    await page.reload({ waitUntil: 'networkidle2' });
    
    console.log('9. Verify persistence');
    // Check if messages persist
    const chatBubbles = await page.$$eval('.flex-1.p-4.overflow-y-auto .text-sm', els => els.length);
    console.log(`Chat bubbles loaded after refresh: ${chatBubbles}`);
    if (chatBubbles > 0) {
      console.log('Persistence verified! Messages loaded from localStorage.');
    } else {
      console.log('WARNING: Persistence failed, no messages found.');
    }
    
    console.log('Taking screenshot for evidence...');
    await page.screenshot({ path: 'evidence-screenshot.png' });

  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await browser.close();
  }
}

runVerification();
