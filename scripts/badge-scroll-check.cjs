/* Scroll choreography regression. Same PLAYWRIGHT_MODULE / BASE_URL / CHROME_PATH as badge-scene-check.cjs. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
const overlap = (a, b) => a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height && a.top + a.height > b.top;
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 1280, height: 800 }]) {
      const page = await browser.newPage({ viewport });
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/index-badge.html');
      await page.locator('.opening-skip').click();
      await page.mouse.move(viewport.width / 2, viewport.height / 2);
      await page.keyboard.press('Escape');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(700);
      const sample = () => page.evaluate(() => ({
        y: scrollY, start: BadgeScene.scroll.start,
        logo: document.querySelector('.mast > a').getBoundingClientRect().toJSON(),
        logoOpacity: Number(document.querySelector('.mast > a').style.opacity),
        docked: document.querySelector('.mast-docked').getBoundingClientRect().toJSON(),
        dockedOpacity: Number(document.querySelector('.mast-docked').style.opacity),
        scale: new DOMMatrix(getComputedStyle(document.querySelector('.badge-stage')).transform).a,
        opacity: Number(getComputedStyle(document.querySelector('.badge-stage')).opacity),
        items: BadgeScene.runtime.field.items.filter(i => i.featured).map(i => ({ index: i.index, alpha: i.opacity, ...i.rect })),
        headers: BadgeScene.runtime.reading.headers.map(h => ({ alpha: Number(h.el.style.opacity), ...h.el.getBoundingClientRect().toJSON() })),
        groups: BadgeScene.groups.map(g => ({ id: g.id, center: g.center, start: g.start })),
        axis: [...document.querySelector('.chapter-progress-label').children].map(e => e.textContent),
        progress: Number(document.querySelector('.chapter-progress-track').getAttribute('aria-valuenow'))
      }));
      const initial = await sample();
      assert.equal(await page.locator('.scene-overview-heading > .micro').count(), 0);
      const tags = await page.evaluate(() => BadgeScene.runtime.reading.headers.map(h => ({
        expected: h.group.keywords,
        actual: Array.from(h.el.querySelectorAll('.scene-keywords > span')).map(el => el.textContent),
        styles: Array.from(h.el.querySelectorAll('.scene-keywords > span')).map(el => {
          const s = getComputedStyle(el); return [s.fontFamily, s.borderTopWidth, s.borderRadius];
        })
      })));
      tags.forEach(group => {
        assert.deepEqual(group.actual, group.expected);
        assert.ok(group.styles.every(s => s[0].includes('monospace') && s[1] === '1px' && s[2] === '2px'));
      });
      assert.deepEqual(initial.groups.map(g => g.id), ['independent', 'ux', 'experimental']);
      assert.ok(initial.items.every(i => i.alpha === 0));
      assert.ok(Math.abs(initial.logo.left + initial.logo.width / 2 - viewport.width / 2) < 1);
      assert.deepEqual(initial.axis, ['2026', '2018']);
      assert.equal(await page.locator('.mast').evaluate(e => getComputedStyle(e).borderBottomWidth), '0px');
      await page.evaluate(() => BadgeScene.scroll.lenis.scrollTo(innerHeight * .3, { immediate: true, force: true }));
      await page.waitForFunction(() => Number(document.querySelector('.badge-stage').style.opacity) < 1);
      const exit = await sample();
      assert.ok(exit.opacity > 0 && exit.opacity < 1, JSON.stringify({ y: exit.y, opacity: exit.opacity, start: exit.start, errors }));
      assert.ok(Math.abs(exit.logo.left - initial.logo.left) < 1, 'center logo must not slide');
      assert.equal(exit.logoOpacity, 0);
      assert.equal(exit.dockedOpacity, 1);
      assert.ok(Math.abs(exit.docked.left - 28) < 1);
      assert.ok(exit.scale > initial.scale, 'departing badge grows rather than shrinks');
      // All chapter images and text enlarge as ONE composition, with a 1:1 reading interval.
      for (const g of initial.groups) {
        const sizes = [];
        for (const t of [g.start, g.center - .1, g.center + .1, g.start + 1.17]) {
          await page.evaluate(t => BadgeScene.scroll.go(t, true), t);
          await page.waitForFunction(t => Math.abs(BadgeScene.runtime.state.travel - t) < .002, t);
          const cohort = await page.evaluate(id => {
            const rt = BadgeScene.runtime, items = rt.field.items.filter(i => i.featured && i.group.id === id);
            const heading = rt.reading.headers.find(h => h.group.id === id).el;
            return { scales: items.map(i => i.sceneScale), widths: items.map(i => rt.rig.rect(i.mesh, true).width), textScale: new DOMMatrix(getComputedStyle(heading).transform).a };
          }, g.id);
          assert.ok(cohort.scales.every(s => Math.abs(s - cohort.textScale) < .00001), 'images and chapter copy must share zoom');
          sizes.push(cohort);
        }
        assert.ok(sizes[0].scales[0] < .94 && sizes[3].scales[0] > 1.07);
        assert.equal(sizes[1].scales[0], 1); assert.equal(sizes[2].scales[0], 1);
        for (let i = 0; i < sizes[0].widths.length; i++) {
          assert.ok(sizes[0].widths[i] < sizes[1].widths[i]);
          assert.ok(sizes[3].widths[i] > sizes[2].widths[i]);
        }
      }
      // Sample all transitions, not only the perfectly arranged chapter centers.
      let previous = -1;
      for (let t = 0; t < 3.95; t += .1) {
        await page.evaluate(t => BadgeScene.scroll.go(t, true), t);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const s = await sample();
        const items = s.items.filter(i => i.alpha > .3 && i.top < viewport.height && i.top + i.height > 0);
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) assert.ok(!overlap(items[i], items[j]), `card overlap at ${t}: ${items[i].index}/${items[j].index}`);
          for (const h of s.headers.filter(h => h.alpha > .3)) assert.ok(!overlap(items[i], h), `copy overlap at ${t}: ${items[i].index}`);
        }
        assert.deepEqual(s.axis, ['2026', '2018']);
        assert.ok(s.progress >= previous, 'global axis must never restart at chapter boundaries');
        previous = s.progress;
      }
      await page.evaluate(() => BadgeScene.scroll.go(BadgeScene.groups[0].center, true));
      await page.waitForTimeout(100);
      assert.ok((await sample()).progress < previous);
      await page.evaluate(() => BadgeScene.scroll.lenis.scrollTo(0, { immediate: true, force: true }));
      await page.waitForFunction(() => Number(document.querySelector('.badge-stage').style.opacity) === 1);
      const returned = await sample();
      assert.equal(returned.opacity, 1);
      assert.ok(Math.abs(returned.logo.left - initial.logo.left) < 1);
      assert.equal(await page.locator('.badge-stage').evaluate(e => e.inert), false);
      console.log('PASS', viewport.width, 'badge-only hero, stationary logo crossfade, collective chapter zoom, no transition overlaps, global 2026–2018 axis');
      await page.close();
    }
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion });
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/index-badge.html#work-independent');
      await page.locator('.badge-scroll-guide:not([hidden])').waitFor();
      await page.locator('.scene-chapter-nav a[href="#work-experimental"]').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('.scene-chapter-nav a[aria-current]')?.hash === '#work-experimental');
      assert.deepEqual(await page.locator('.chapter-progress-label').evaluate(el => [...el.children].map(e => e.textContent)), ['2026', '2018']);
      assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden');
      assert.equal(await page.locator('.scene-fallback a').count(), 17);
      console.log('PASS mobile', reducedMotion, 'chapter keyboard navigation and global range');
      await page.close();
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
