/* Historical script name retained: now verifies all three native mobile chapters. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
const out = process.env.ARTIFACT_DIR;
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  if(out) fs.mkdirSync(out,{recursive:true});
  const errors=[];
  try {
    for(const [width,height] of [[390,844],[375,667],[320,568],[700,700]]) {
      const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>sessionStorage.setItem('portfolio-intro-played','1'));
      await page.goto(base+'/index-badge.html');
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForFunction(()=>BadgeScene.runtime.nativeHeld && BadgeScene.runtime.frame===0);
      assert.equal(await page.evaluate(()=>BadgeScene.scroll.lenis),null);
      assert.equal(await page.locator('.badge-scroll-guide').isVisible(),false);
      assert.equal(await page.locator('#fallback-archive').isVisible(),false);
      assert.equal(await page.locator('.scene-fallback a:visible').count(),11);
      for(const [group,count] of [['independent',4],['ux',4],['experimental',3]]) {
        const section=page.locator('#fallback-'+group);
        assert.equal(await section.locator('a').count(),count);
        await page.evaluate(id=>{const g=BadgeScene.groups.find(g=>g.id===id);BadgeScene.scroll.go(g.center,true)},group);
        await page.waitForTimeout(400);
        const geometry=await section.evaluate(el=>{
          const links=[...el.querySelectorAll('a')];
          return {top:el.getBoundingClientRect().top,titleAlign:getComputedStyle(el.querySelector('h2')).textAlign,rects:links.map(a=>({a:a.getBoundingClientRect().toJSON(),img:a.querySelector('img').getBoundingClientRect().toJSON(),title:a.querySelector('h3').getBoundingClientRect().toJSON()})),gap:links[0].getBoundingClientRect().top-el.querySelector(':scope>p:not(.scene-keywords)').getBoundingClientRect().bottom};
        });
        assert.ok(Math.abs(geometry.top-88)<2,`${group} clears masthead`);
        assert.equal(geometry.titleAlign,'left');assert.ok(Math.abs(geometry.gap-32)<1);
        geometry.rects.forEach((r,i)=>{
          assert.ok(r.img.width>=Math.min(width-40,520)-1);
          assert.ok(Math.abs(r.img.width/r.img.height-16/9)<.01);
          assert.ok(Math.abs(r.img.left-geometry.rects[0].img.left)<1);
          assert.ok(Math.abs(r.title.top-r.img.bottom-12)<1);
          if(i)assert.ok(Math.abs(r.a.top-geometry.rects[i-1].a.bottom-36)<1);
        });
        const first=section.locator('a').first();
        const before=await first.boundingBox();await page.evaluate(()=>scrollBy(0,120));await page.waitForTimeout(200);const after=await first.boundingBox();
        assert.ok(Math.abs(before.y-after.y-120)<1,'native 1:1 motion');
        await page.evaluate(()=>scrollBy(0,-120));
        if(out && width===390)await page.screenshot({path:path.join(out,'native-'+group+'.png')});
        // Touch through both detail templates and restore the original HTML card position.
        if(width===390){
          await first.evaluate(a=>a.scrollIntoView({block:'center'}));await page.waitForTimeout(300);
          const y=await page.evaluate(()=>scrollY),href=await first.getAttribute('href');
          await first.tap();await page.waitForURL('**/project-scrollcarousel.html?**');
          assert.equal(new URL(page.url()).searchParams.get('project'),new URL(href,base).searchParams.get('project'));
          await page.locator('[data-return-home]').first().click();await page.waitForURL('**/index-badge.html**');
          await page.waitForFunction(()=>window.BadgeScene?.runtime?.nativeHeld && !new URL(location.href).searchParams.has('restore'));
          await page.waitForTimeout(900);
          assert.ok(Math.abs(await page.evaluate(()=>scrollY)-y)<3,'detail return position');
          assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
        }
      }
      await page.evaluate(()=>BadgeScene.scroll.go(BadgeScene.groups[1].center+.2,true));await page.waitForTimeout(300);
      const beforeResize=await page.evaluate(()=>{
        window.resizeScrollCalls=[];const original=window.scrollTo;
        window.scrollTo=function(...args){resizeScrollCalls.push({args,stack:new Error().stack});return original.apply(this,args)};
        return {y:scrollY,top:document.querySelector('#fallback-ux').getBoundingClientRect().top};
      });
      await page.setViewportSize({width,height:height-70});await page.waitForTimeout(500);
      const afterResize=await page.evaluate(()=>({y:scrollY,top:document.querySelector('#fallback-ux').getBoundingClientRect().top,calls:resizeScrollCalls}));
      assert.ok(Math.abs(afterResize.top-beforeResize.top)<2,'browser scroll anchoring preserves the visible content');
      assert.ok(!afterResize.calls.some(c=>c.stack.includes('badge-scene-scroll.js')),'toolbar height does not force scene scrolling');
      await page.setViewportSize({width:1100,height:800});await page.waitForTimeout(700);
      assert.equal(await page.evaluate(()=>BadgeScene.nativeMobile),false);
      assert.equal(await page.locator('.scene-fallback').isVisible(),false);
      assert.ok(await page.evaluate(()=>Boolean(BadgeScene.scroll.lenis)));
      assert.equal(await page.evaluate(()=>BadgeScene.runtime.state.group.id),'ux');
      await page.setViewportSize({width,height});await page.waitForTimeout(500);
      assert.equal(await page.evaluate(()=>BadgeScene.nativeMobile),true);
      assert.equal(await page.evaluate(()=>BadgeScene.runtime.state.group.id),'ux');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.close();console.log(`PASS native mobile ${width}×${height}`);
    }
    for(const reduced of [true,false]){
      const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:reduced?'reduce':'no-preference'});
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>sessionStorage.setItem('portfolio-intro-played','1'));
      await page.goto(base+'/index-badge.html#work-parsons');
      if(!reduced)await page.evaluate(()=>BadgeScene.runtime.renderer.getContext().getExtension('WEBGL_lose_context').loseContext());
      await page.waitForSelector('.scene-fallback-mode');
      assert.equal(await page.locator('.scene-fallback a:visible').count(),18);
      assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
      await page.close();console.log('PASS '+(reduced?'reduced motion / alias':'WebGL failure'));
    }
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
