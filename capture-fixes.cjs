const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });

  // 1. Command Center Page
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'command-center-no-zoom.png' });

  // 2. Refinery Page (Table & Map)
  await page.goto('http://localhost:3000/refinery', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000); // Wait for map to load
  
  // Find the vulnerability map
  const mapEl = await page.$('.maplibregl-canvas');
  if (mapEl) {
    await mapEl.screenshot({ path: 'vulnerability-map.png' });
  }

  // Click the first refinery's expand button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const expandBtn = btns.find(b => b.textContent.includes('Jamnagar Refinery'));
    if (expandBtn) expandBtn.click();
  });
  
  await page.waitForTimeout(500);
  
  // Screenshot the table specifically
  const tableEl = await page.$('table');
  if (tableEl) {
    await tableEl.screenshot({ path: 'refinery-table-expanded.png' });
  } else {
    await page.screenshot({ path: 'refinery-page-expanded.png' });
  }

  await browser.close();
})();
