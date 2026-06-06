export async function createCase(page) {
  await page.goto('/home?lang=en-IN&demo=true');
  await page.locator('text=English').first().click();
  await page.locator('text=Standard').first().click();
  await page.locator('text=Routine').first().click();
  const startBtn = page.locator('button:has-text("Start")').first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
  } else {
    // maybe it auto-submits?
  }
}
