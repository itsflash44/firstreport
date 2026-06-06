import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to setup case in localStorage...");
  await page.goto('http://localhost:3000/history');
  
  await page.evaluate(() => {
    const fakeCase = {
      id: "test-case-123",
      title: "Test Wallet Case",
      language: "en-IN",
      status: "active",
      personaId: "standard",
      severity: "normal",
      incidentSummary: "Testing contradiction",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timeline: [],
      conversations: [],
      documentsGenerated: [],
      evidence: [],
      reminders: [],
      pendingSteps: [],
      statutesCited: [],
      sessionIds: []
    };
    localStorage.setItem('fr_legal_journey', JSON.stringify([fakeCase]));
  });

  console.log("Navigating to case page");
  await page.goto('http://localhost:3000/case/test-case-123');
  
  console.log("Waiting for page load...");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'CasePage_Debug.png' });
  console.log("Screenshot CasePage_Debug.png taken");

  // Wait for the textarea
  await page.waitForSelector('textarea.fr-input');
  
  console.log("Sending first message: My wallet was stolen at 2 PM.");
  await page.fill('textarea.fr-input', 'My wallet was stolen at 2 PM.');
  await page.keyboard.press('Enter');
  
  // Wait for AI response bubble
  console.log("Waiting for AI response...");
  await page.waitForTimeout(4000); // Give it time to process and return
  
  console.log("Sending second message: My wallet was stolen at 4 PM.");
  await page.fill('textarea.fr-input', 'My wallet was stolen at 4 PM.');
  await page.keyboard.press('Enter');
  
  // Wait for AI response bubble
  console.log("Waiting for second AI response...");
  await page.waitForTimeout(4000);
  
  // Open TruthTrail
  console.log("Opening TruthTrail panel");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const ttBtn = btns.find(b => b.textContent.includes('TruthTrail'));
    if (ttBtn) ttBtn.click();
  });
  
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'Contradiction_Screenshot.png' });
  console.log("Screenshot saved as Contradiction_Screenshot.png");

  // Read scores
  const trustScore = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent?.includes('Trust Score is'));
    const match = el ? el.textContent.match(/Trust Score is (\d+)/) : null;
    return match ? match[1] : null;
  });
    
  const confScore = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent?.includes('Confidence Score is'));
    const match = el ? el.textContent.match(/Confidence Score is (\d+)/) : null;
    return match ? match[1] : null;
  });

  const contradictions = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent?.includes('Contradictions found:'));
    const match = el ? el.textContent.match(/Contradictions found: (.*?)\./) : null;
    return match ? match[1] : null;
  });

  console.log("RESULTS:");
  console.log("Trust Score:", trustScore);
  console.log("Confidence Score:", confScore);
  console.log("Contradictions Found:", contradictions);

  // Read from Dexie to verify facts
  const facts = await page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('FirstReportDB');
      request.onsuccess = (e) => {
        const db = e.target.result;
        try {
          const tx = db.transaction('caseFacts', 'readonly');
          const store = tx.objectStore('caseFacts');
          const all = store.getAll();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => reject(all.error);
        } catch(err) {
          resolve([]);
        }
      };
      request.onerror = () => reject(request.error);
    });
  });
  console.log("Persisted Facts in Dexie:");
  console.log(JSON.stringify(facts, null, 2));

  await browser.close();
})();
