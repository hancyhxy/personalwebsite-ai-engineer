/* Menu / directory / résumé handoff. Run with the same Playwright env as badge-scene-check.cjs. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
const out = process.env.SCREENSHOT_DIR;
(async () => {
  if (out) fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    for (const config of [
      { name: 'desktop', viewport: { width: 1440, height: 1000 } },
      { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
      { name: 'reduced', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }
    ]) {
      const { name, ...options } = config;
      const page = await browser.newPage(options); page.setDefaultTimeout(20000); page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/index-badge.html#top');
      await page.evaluate(() => Promise.all([document.fonts.ready, BADGE_WORK_READY]));
      assert.equal(await page.locator('#portfolio-menu-toggle').isVisible(), false);
      assert.equal(await page.locator('.work-static-toggle').count(), 0);
      assert.equal(await page.locator('main #work-next').count(), 0);
      assert.equal(await page.locator('#resume-section').evaluate(e => getComputedStyle(e).borderTopWidth), '0px');
      await page.evaluate(() => scrollTo(0, innerHeight * .3));
      await page.waitForFunction(() => !document.getElementById('portfolio-menu-toggle').inert && !document.getElementById('portfolio-menu-toggle').hidden);
      const origin = await page.evaluate(() => ({ y: scrollY, height: document.documentElement.scrollHeight }));
      await page.locator('#portfolio-menu-toggle').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('#portfolio-menu').evaluate(e => e.open), true);
      assert.equal(await page.evaluate(() => document.activeElement.className), 'portfolio-menu-close');
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => !!document.activeElement.closest('#portfolio-menu')), true, 'native modal must contain keyboard focus');
      }
      if (out) await page.screenshot({ path: path.join(out, name + '-menu.png') });
      await page.locator('.portfolio-menu-all').click();
      assert.equal(await page.locator('#work-collection .work-item').count(), 17);
      assert.equal(await page.locator('#work-collection .work-item[target="_blank"]').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollHeight), origin.height, 'opening directory must not lengthen page');
      await page.locator('button[data-layout="journey"]').click();
      assert.deepEqual(await page.locator('#work-collection > section').evaluateAll(es => es.map(e => e.id)), ['chapter-independent', 'chapter-bytedance', 'chapter-alibaba', 'chapter-early']);
      assert.equal(await page.evaluate(() => {
        const s = document.querySelector('.portfolio-menu-scroll'); return s.scrollWidth <= s.clientWidth + 1;
      }), true, 'directory must not overflow horizontally');
      await page.mouse.move(config.viewport.width / 2, config.viewport.height / 2);
      await page.mouse.wheel(0, 500);
      await page.waitForFunction(() => document.querySelector('.portfolio-menu-scroll').scrollTop > 100);
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - origin.y) < 2, 'wheel must scroll only the menu');
      const project = page.locator('#work-collection .work-item[href$="project=13"]');
      await project.scrollIntoViewIfNeeded(); await project.focus();
      const saved = await page.evaluate(() => ({ y: scrollY, top: document.querySelector('.portfolio-menu-scroll').scrollTop }));
      assert.ok(saved.top > 0); assert.ok(Math.abs(saved.y - origin.y) < 2, 'directory must not scroll background');
      if (out) await page.screenshot({ path: path.join(out, name + '-directory.png') });
      await project.click(); await page.waitForURL(u => u.pathname.endsWith('/project-scrollcarousel.html'));
      assert.ok(new URL(page.url()).searchParams.has('return'));
      // Browser click auto-scrolling may finish after the pre-click measurement; restore the click-time snapshot.
      const snapshot = await page.evaluate(() => JSON.parse(sessionStorage.getItem('badge-return-' + new URLSearchParams(location.search).get('return'))));
      saved.top = snapshot.menu.top;
      await page.locator('#scc-detail-next').click(); await page.waitForURL(u => u.searchParams.get('project') !== '13');
      await page.locator('.scc-detail-close').click(); await page.waitForURL(u => u.pathname.endsWith('/index-badge.html'));
      await page.waitForFunction(saved => document.getElementById('portfolio-menu').open && Math.abs(document.querySelector('.portfolio-menu-scroll').scrollTop - saved.top) < 2 && Math.abs(scrollY - saved.y) < 2, saved);
      assert.equal(await page.locator('#work-next').getAttribute('data-layout'), 'journey');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.getElementById('portfolio-menu').open && getComputedStyle(document.body).overflow !== 'hidden');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'portfolio-menu-toggle');
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - saved.y) < 2);
      await page.locator('#portfolio-menu-toggle').click();
      await page.locator('.portfolio-menu-chapters a[href="#work-ux"]').click();
      if (name !== 'reduced') {
        await page.waitForFunction(() => Math.abs(BadgeScene.runtime.state.travel - BadgeScene.groups[1].center) < .02);
        await page.evaluate(() => BadgeScene.scroll.go(BadgeScene.groups[2].center, true));
        await page.waitForFunction(() => document.querySelector('.chapter-progress-track').getAttribute('aria-valuenow') === '100');
        await page.evaluate(() => BadgeScene.scroll.go(BadgeScene.duration - .3, true));
        await page.waitForFunction(() => BadgeScene.runtime.opacity < .001 && document.querySelector('.badge-chapter-progress').hidden);
        if (out) await page.screenshot({ path: path.join(out, name + '-resume-handoff.png') });
      } else {
        await page.waitForFunction(() => document.getElementById('fallback-ux').getBoundingClientRect().top < 50);
      }
      console.log('PASS', name, 'menu visibility, keyboard trap/Escape, 17 projects, internal scrolling, sort+scroll return through Next, chapter navigation, clean résumé handoff');
      await page.close();
    }
    const lost = await browser.newPage(); lost.on('pageerror', e => errors.push(e.message));
    await lost.goto(base + '/index-badge.html#work-ux');
    await lost.waitForFunction(() => window.BadgeScene?.runtime?.renderer && !document.getElementById('portfolio-menu-toggle').inert);
    await lost.locator('#portfolio-menu-toggle').click();
    await lost.evaluate(() => BadgeScene.runtime.renderer.getContext().getExtension('WEBGL_lose_context').loseContext());
    await lost.waitForSelector('.scene-fallback-mode');
    assert.equal(await lost.locator('#portfolio-menu').evaluate(e => e.open), true);
    await lost.keyboard.press('Escape');
    await lost.waitForFunction(() => getComputedStyle(document.body).overflow !== 'hidden');
    console.log('PASS context loss while menu is open preserves modal and releases scroll on close');
    await lost.close();
    const failure = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    failure.on('pageerror', e => errors.push(e.message));
    await failure.route('**/content/gallery.json', r => r.abort());
    await failure.goto(base + '/index-badge.html#work-next');
    await failure.waitForFunction(() => document.getElementById('portfolio-menu')?.open);
    await failure.evaluate(() => BADGE_WORK_READY);
    assert.equal(await failure.locator('#work-collection .work-item[href*="project-scrollcarousel.html"]').count(), 17);
    await failure.keyboard.press('Escape');
    await failure.waitForFunction(() => getComputedStyle(document.body).overflow !== 'hidden');
    console.log('PASS failed gallery retains 17 local detail links, legacy archive hash and Escape unlock');
    await failure.close();
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
