const { chromium } = require('C:/Users/Abbas/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const outDir = 'C:/Users/Abbas/.gemini/antigravity-ide/brain/04b9010e-8bdd-419e-bc55-2064f1c4b7bf';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 4000 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/scenario-simulator');
  await page.waitForTimeout(6000);

  const mapEl = await page.$('svg[role="img"]');
  if (mapEl) {
    const box = await mapEl.boundingBox();
    await page.screenshot({
      path: outDir + '/map_v4_coastlines.png',
      clip: { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 45), width: box.width + 16, height: box.height + 60 }
    });
    console.log('Coastline map saved');
  } else {
    console.log('SVG not found');
  }

  await browser.close();
})();
