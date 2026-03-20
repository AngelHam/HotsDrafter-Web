const { chromium } = require('C:/Users/angel/Downloads/VibeCode Hots Drafter/ReactVercelApp/node_modules/playwright-core');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const pages = [
    ['home', 'http://localhost:3000'],
    ['draft', 'http://localhost:3000/draft'],
    ['settings', 'http://localhost:3000/settings'],
    ['history', 'http://localhost:3000/history'],
    ['team_builder', 'http://localhost:3000/team-builder'],
    ['sample', 'http://localhost:3000/sample'],
    ['compare', 'http://localhost:3000/compare'],
    ['tier_list', 'http://localhost:3000/tier-list'],
  ];
  for (const [name, url] of pages) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:/Users/angel/.copilot/session-state/9c2e0fba-d20c-4193-a85d-218c603913f3/files' + '/react_' + name + '.png', fullPage: false });
    console.log('OK: ' + name);
  }
  await browser.close();
  console.log('All done');
})();
