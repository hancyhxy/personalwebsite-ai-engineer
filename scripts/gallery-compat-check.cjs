/* Verify the 16 legacy routes plus the current /gallery case before custom-domain cutover. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = (process.env.BASE_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');
const slugs = [
  'portfolio-ai-assistant',
  'interactive-virtual-drum-kit',
  'friendup-social-app',
  'Rider-Dispatch-Scheduling-Platform',
  'Content-Driven-Food-Delivery-Experience',
  'Re-Architecting-Alibaba-Help-Center-for-Global-Consistency',
  'KOL-Growth-Strategy',
  'customer-service-workspace-chatbot',
  'my-friends-are-my-power-station',
  'gamify-museum-experience',
  'food-memory',
  'how-are-oscars-biased',
  'the-museum-kit',
  'solar-system-relationship',
  'Farmer-Coffee-Logo',
  'musically-1m-audition',
  'tech-fest-ai-showcase'
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const failures = [];
  try {
    const expectedHome = new URL(base + '/index.html').pathname;
    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
      const mobile = viewport.width < 600;
      const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile });
      page.on('pageerror', error => failures.push(`${viewport.width}px page error: ${error.message}`));
      page.on('response', response => {
        const url = new URL(response.url());
        if (url.origin === new URL(base).origin && response.status() >= 400) {
          failures.push(`${response.status()} ${response.url()}`);
        }
      });
      for (const slug of slugs) {
        const response = await page.goto(`${base}/gallery/${slug}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        assert.ok(response && response.ok(), `${slug} document must return 200`);
        await page.waitForFunction(() => document.querySelector('.nav-header') && document.querySelector('.contact-section'), null, { timeout: 15000 });
        const hero = page.locator('.hero-image').first();
        await hero.waitFor();
        await hero.evaluate(image => image.decode());
        assert.ok(await hero.evaluate(image => image.naturalWidth > 0), `${slug} hero must load`);
        assert.notEqual(await page.title(), '', `${slug} title must exist`);
        const home = await page.locator('.nav-header .name-link').getAttribute('href');
        assert.equal(new URL(home, page.url()).pathname, expectedHome, `${slug} must return to the new homepage`);
        if (mobile) {
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true, `${slug} must not overflow at 390px`);
        }
      }
      await page.close();
      console.log(`PASS ${viewport.width}px: 17 gallery routes, shared components, Heroes and homepage returns`);
    }
    assert.deepEqual(failures, []);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
