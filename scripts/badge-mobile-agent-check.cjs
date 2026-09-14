/* Mobile icon / bottom-axis regression. Run against an HTTP-served Badge site. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    for (const [width,height,reduced] of [[320,568,false],[390,844,false],[700,700,false],[701,800,false],[1440,900,false],[390,667,true]]) {
      const page = await browser.newPage({viewport:{width,height},isMobile:width<=700,hasTouch:width<=700,reducedMotion:reduced?'reduce':'no-preference'});
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>sessionStorage.setItem('portfolio-intro-played','1'));
      await page.goto(base+'/index-badge.html');
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForTimeout(500);
      const mobile=width<=700, fab=page.locator('#agent-fab');
      const check=async(axisExpected)=>{
        if(mobile) await page.waitForFunction(expected=>document.body.classList.contains('mobile-work-axis-active')===expected,axisExpected,{timeout:15000});
        await page.waitForTimeout(500);
        const v=await page.evaluate(()=>{
          const fab=document.querySelector('#agent-fab'),axis=document.querySelector('.badge-chapter-progress');
          return {fab:fab.getBoundingClientRect().toJSON(),axis:axis.getBoundingClientRect().toJSON(),axisVisible:!axis.hidden,text:getComputedStyle(fab.firstElementChild).display,label:fab.getAttribute('aria-label'),active:document.body.classList.contains('mobile-work-axis-active')};
        });
        assert.ok(v.label.includes('Ask'));
        assert.equal(v.text==='none',mobile);
        if(mobile){assert.equal(v.fab.width,48);assert.equal(v.fab.height,48);assert.equal(v.active,axisExpected);assert.equal(v.axisVisible,axisExpected);if(axisExpected){assert.ok(v.fab.bottom+8<=v.axis.top);assert.ok(Math.abs(height-v.axis.bottom-12)<1)}else assert.ok(Math.abs(height-v.fab.bottom-10)<1)}
        await fab.click();
        await page.waitForTimeout(400);
        assert.equal(await fab.getAttribute('aria-expanded'),'true');
        assert.equal(await page.locator('#agent-panel [data-provider]').count(),3);
        const p=await page.locator('#agent-panel').boundingBox();
        assert.ok(p.x>=0 && p.x+p.width<=width+1 && p.y>=0);
        if(mobile) assert.ok(p.y+p.height<=v.fab.top);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#agent-panel').isHidden(),true);
        await page.evaluate(()=>document.activeElement?.blur());
      };
      await check(false);
      if(reduced)await page.locator('#fallback-independent').evaluate(e=>e.scrollIntoView());
      else await page.evaluate(()=>BadgeScene.scroll.go(BadgeScene.groups[1].center,true));
      await check(mobile);
      await page.locator('#resume-section').evaluate(e=>e.scrollIntoView());
      await page.waitForTimeout(800);
      await check(false);
      if(!reduced)await page.evaluate(()=>BadgeScene.scroll.go(BadgeScene.groups[1].center,true));
      else await page.locator('#fallback-independent').evaluate(e=>e.scrollIntoView());
      await check(mobile);
      assert.deepEqual(errors,[]);
      await page.close();
      console.log(`PASS ${width}×${height}${reduced?' reduced motion':''}`);
    }
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1)});
