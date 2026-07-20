const { chromium } = require('C:/Users/Abbas/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const outDir = 'C:/Users/Abbas/.gemini/antigravity-ide/brain/35fc4987-6ada-46cf-8389-bcb9ea68d914';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 4500 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/scenario-simulator');
  await page.waitForTimeout(2000);

  // Click Strait of Hormuz — Full Closure
  await page.evaluate(() => {
    const presets = Array.from(document.querySelectorAll('h3'));
    const hormuzPreset = presets.find(p => p.textContent.includes('Strait of Hormuz — Full Closure'));
    if (hormuzPreset) hormuzPreset.parentElement.click();
  });
  await page.waitForTimeout(500);

  // Click Run Baseline
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const runBtn = btns.find(b => b.textContent.includes('RUN BASELINE SIMULATION'));
    if (runBtn) runBtn.click();
  });
  
  await page.waitForTimeout(5000);

  // Click Strategic Reserve Release
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const sprLabel = labels.find(l => l.textContent.includes('Strategic Reserve Release'));
    if (sprLabel) sprLabel.click();
  });
  await page.waitForTimeout(500);

  // Click Spot Market Chartering
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const spotLabel = labels.find(l => l.textContent.includes('Spot Market Chartering'));
    if (spotLabel) spotLabel.click();
  });
  await page.waitForTimeout(500);

  // Click Apply levers
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const applyBtn = btns.find(b => b.textContent.includes('Apply levers'));
    if (applyBtn) applyBtn.click();
  });
  
  await page.waitForTimeout(3000);

  // Capture Hormuz Node Trajectory
  const cardLocator = page.locator('h3:has-text("Node Trajectory")').locator('..').locator('..').locator('..');
  if (await cardLocator.count() > 0) {
    await cardLocator.first().screenshot({ path: outDir + '/node_trajectory_hormuz.png' });
    console.log('Hormuz captured');
  }

  // Click Mundra Port
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const mundraBtn = btns.find(b => b.textContent.includes('Mundra Port'));
    if (mundraBtn) mundraBtn.click();
  });
  await page.waitForTimeout(500);

  if (await cardLocator.count() > 0) {
    await cardLocator.first().screenshot({ path: outDir + '/node_trajectory_mundra.png' });
    console.log('Mundra captured');
  }

  await browser.close();
})();
