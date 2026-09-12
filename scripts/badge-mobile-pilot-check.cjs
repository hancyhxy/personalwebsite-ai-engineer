/* Independent Work mobile pilot. Run against the HTTP-served site; no package installation required here. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
const out = process.env.ARTIFACT_DIR;
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    if (out) fs.mkdirSync(out, {recursive:true});
    for (const [width,height] of [[390,844],[375,667],[320,568],[700,600]]) {
      const page = await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/index-badge.html');
      await page.locator('.opening-skip').tap();
      await page.waitForFunction(() => window.BadgeScene?.runtime?.field && !BadgeScene.runtime.field.opening.active);
      await page.evaluate(() => document.fonts.ready);
      const go = async t => {
        await page.evaluate(() => document.activeElement?.blur());
        await page.waitForTimeout(350);
        await page.evaluate(t => BadgeScene.scroll.go(t,true), t);
        try { await page.waitForFunction(t => Math.abs(BadgeScene.runtime.state.travel-t)<.005,t,{timeout:5000}); }
        catch(e) { console.error('Scroll mismatch',t,await page.evaluate(()=>({travel:BadgeScene.runtime.state.travel,y:scrollY,h:innerHeight,start:BadgeScene.scroll.start}))); throw e; }
        await page.waitForTimeout(180);
      };
      await go(.6);
      assert.equal(await page.evaluate(() => BadgeScene.mobilePilot), true);
      assert.equal(await page.evaluate(() => innerWidth),width,'badge exit must not widen the layout viewport');
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      assert.equal(await page.evaluate(() => BadgeScene.scroll.lenis?.options.syncTouch), false);
      const intro = await page.evaluate(() => {
        const b=BadgeScene, r=b.runtime;
        return {heading:r.reading.headers[0].el.getBoundingClientRect().toJSON(), first:r.field.items[b.groups[0].projects[0]].rect, layout:b.mobileComposition, ids:b.groups[0].projects};
      });
      assert.ok(intro.heading.bottom + 30 < intro.first.top, 'copy/image clearance');
      assert.ok(intro.first.width >= Math.min(width*.70,379), 'large mobile artwork');
      assert.ok(intro.first.top + intro.first.height < height-35, 'first artwork fits');
      if(out && width===390) await page.screenshot({path:path.join(out,'mobile-intro.png')});
      for(let i=0;i<intro.ids.length;i++) {
        // Center each project through native page travel, not automatic extraction or a carousel.
        const t=.6+(intro.layout.firstY+i*intro.layout.gap-height*.45)/(height*.7);
        await go(t);
        const index=intro.ids[i];
        const rect = await page.evaluate(index => {
          const b=BadgeScene, item=b.runtime.field.items[index], link=b.interaction.links[index];
          return {image:item.rect,label:link.querySelector('span').getBoundingClientRect().toJSON(),link:link.getBoundingClientRect().toJSON(),opacity:item.opacity,hidden:link.hidden};
        }, index);
        assert.equal(rect.hidden,false);
        assert.equal(rect.opacity,1);
        assert.ok(rect.image.left>=0 && rect.image.left+rect.image.width<=width-52,'image clears the navigation rail');
        assert.ok(rect.image.top>=60 && rect.label.bottom<height-70,'complete artwork and caption visible');
        for(const key of ['left','top','width','height']) assert.ok(Math.abs(rect.image[key]-rect.link[key])<1);
        const link=page.locator('.scene-project-hit').nth(index);
        const origin=await page.evaluate(()=>BadgeScene.runtime.state.travel);
        await link.tap();
        await page.waitForURL(url=>url.pathname.endsWith('/project-scrollcarousel.html') && url.searchParams.get('project')===String(index));
        await page.locator('#scc-detail-hero-image').evaluate(img=>img.decode());
        await page.waitForFunction(()=>document.querySelector('#scc-detail-content h2, #scc-detail-content h3'));
        await page.locator('.scc-detail-close').tap();
        await page.waitForURL(url=>url.pathname.endsWith('/index-badge.html'));
        await page.waitForFunction(t=>Math.abs(window.BadgeScene?.runtime?.state?.travel-t)<.01 && window.ProjectFlip?.phase==='idle',origin);
        assert.equal(await page.locator('.portfolio-opening').count(),0,'detail returns without replay');
        await page.evaluate(()=>document.activeElement?.blur());
        await page.waitForTimeout(200);
        if(out && width===390 && i===2) await page.screenshot({path:path.join(out,'mobile-gallery.png')});
      }
      await go(.6);
      const restored=await page.evaluate(() => BadgeScene.runtime.field.items[BadgeScene.groups[0].projects[0]].rect);
      assert.ok(Math.abs(restored.top-intro.first.top)<1,'reverse restores composition');
      await page.setViewportSize({width:width===700 ? 690 : width,height:height+80});
      await page.waitForTimeout(700);
      assert.ok(Math.abs(await page.evaluate(() => BadgeScene.runtime.state.travel)-.6)<.01,'resize preserves travel');
      await page.setViewportSize({width:1440,height:900});
      await page.waitForTimeout(700);
      assert.equal(await page.evaluate(() => BadgeScene.mobilePilot),false);
      assert.ok(Math.abs(await page.evaluate(() => BadgeScene.duration)-3.95)<.001);
      await go(.6);
      await page.setViewportSize({width,height});
      await page.waitForTimeout(700);
      assert.equal(await page.evaluate(() => BadgeScene.mobilePilot),true);
      const ux = await page.evaluate(() => BadgeScene.groups[1].center);
      await go(ux);
      assert.equal(await page.evaluate(() => BadgeScene.runtime.state.group.id),'ux');
      assert.equal(await page.locator('.scene-chapter-nav a[aria-current]').getAttribute('href'),'#work-ux');
      const end=await page.evaluate(() => BadgeScene.duration-.35);
      await go(end);
      assert.ok(await page.evaluate(() => BadgeScene.runtime.opacity<.001));
      await page.close();
      console.log(`PASS ${width}×${height}: readable copy, four large/tappable projects, native touch, reverse, resize/breakpoint, next chapter and exit`);
    }
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
