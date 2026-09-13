/* Real-document Flip + Zoom: PLAYWRIGHT_MODULE, CHROME_PATH, BASE_URL, ARTIFACT_DIR. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8765', out=process.env.ARTIFACT_DIR;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  if(out)fs.mkdirSync(out,{recursive:true});
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile});
   await context.addInitScript(()=>{
    for(const type of ['project-flip-start','project-flip-end'])addEventListener(type,e=>{const events=JSON.parse(sessionStorage.getItem('flip-test-events')||'[]');events.push({type,direction:e.detail.direction});sessionStorage.setItem('flip-test-events',JSON.stringify(events));});
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   const home=async(hash='#work-independent')=>{
    await page.goto(base+'/index-badge.html'+hash,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.BadgeScene?.runtime?.state && !BadgeScene.runtime.field.opening.active);
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
   };
   const idle=()=>page.waitForFunction(()=>window.ProjectFlip?.phase==='idle' && !document.documentElement.classList.contains('project-flip-return-pending'));
   const events=()=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('flip-test-events')||'[]'));
   await home();
   for(const index of [0,3]){
    await page.evaluate(i=>{const b=BadgeScene,g=b.groups.find(g=>g.projects.includes(i));b.scroll.go(g.center,true);ProjectFlip.warm(i);},index);
    await page.waitForTimeout(450);
    const origin=await page.evaluate(()=>({y:scrollY,travel:BadgeScene.runtime.state.travel}));
    if(!mobile && index===0){await page.locator('.scene-project-hit').nth(index).focus();await page.keyboard.press('Enter');}
    else await page.evaluate(i=>BadgeScene.interaction.links[i].click(),index);
    await page.waitForFunction(()=>ProjectFlip.phase==='opening');
    const surface=await page.evaluate(()=>{
     const el=document.querySelector('.project-flip-document'),m=new DOMMatrix(getComputedStyle(el).transform);
     return {uniform:Math.abs(m.a-m.d)<.001,preview:!!document.querySelector('.badge-project-panel'),frames:document.querySelectorAll('iframe[src*="measure="]').length,dialog:document.querySelector('.project-flip-layer').open};
    });
    assert.ok(surface.uniform && surface.dialog);assert.equal(surface.preview,false);assert.equal(surface.frames,0);
    if(out && index===0)await page.screenshot({path:path.join(out,(mobile?'mobile':'desktop')+'-opening.png')});
    await page.waitForURL(u=>u.pathname.endsWith('/project-scrollcarousel.html')&&u.searchParams.get('project')===String(index));
    await page.locator('#scc-detail-hero-image').evaluate(img=>img.decode());
    await page.waitForFunction(()=>document.querySelector('#scc-detail-content h2,#scc-detail-content h3'));
    assert.equal(await page.locator('#scc-detail-content').getAttribute('data-layout'),index===0?'stacked':'two-column');
    assert.equal(await page.locator('.project-flip-layer').count(),0,'no arrival replay');
    if(!mobile && index===0)assert.equal(await page.locator('.scc-detail-close').evaluate(el=>el===document.activeElement),true,'keyboard arrival exposes the close control');
    assert.ok((await events()).some(e=>e.type==='project-flip-end'&&e.direction==='opening'));
    if(index===3){await page.evaluate(()=>scrollTo(0,1400));await page.waitForTimeout(100);}
    if(mobile)await page.locator('.scc-detail-close').tap();else await page.keyboard.press('Escape');
    await page.waitForURL(u=>u.pathname.endsWith('/index-badge.html'));
    await idle();
    assert.ok(Math.abs(await page.evaluate(()=>scrollY)-origin.y)<2);
    assert.ok(Math.abs(await page.evaluate(()=>BadgeScene.runtime.state.travel)-origin.travel)<.005);
    const returnEvents=await events();
    assert.ok(returnEvents.some(e=>e.type==='project-flip-end'&&e.direction==='closing'),'reverse events: '+JSON.stringify(returnEvents));
    assert.equal(await page.locator('.project-flip-layer,.badge-project-panel,.portfolio-opening').count(),0);
    assert.equal(await page.evaluate(()=>BadgeScene.scroll.locked),false);
    await page.waitForFunction(i=>BadgeScene.interaction.links[i]===document.activeElement,index);
   }
   console.log('PASS '+(mobile?'mobile':'desktop')+': one-step flip, both detail templates, deep close, reverse/focus/scroll restoration');
   // Abort in flight, then verify the same source is immediately usable.
   await page.evaluate(()=>{document.activeElement?.blur();BadgeScene.scroll.go(BadgeScene.groups[0].center,true);ProjectFlip.warm(0);});
   await page.waitForFunction(()=>Math.abs(BadgeScene.runtime.state.travel-BadgeScene.groups[0].center)<.01 && !BadgeScene.interaction.links[0].hidden);
   await page.evaluate(()=>BadgeScene.interaction.links[0].click());
   try{await page.waitForFunction(()=>window.ProjectFlip?.phase==='opening',null,{timeout:4000});}catch(e){console.error('Cancellation setup',page.url(),await page.evaluate(()=>({phase:window.ProjectFlip?.phase,travel:window.BadgeScene?.runtime?.state?.travel,events:sessionStorage.getItem('flip-test-events')})));throw e;}
   await page.keyboard.press('Escape');await idle();
   assert.ok(page.url().includes('index-badge.html'));assert.equal(await page.evaluate(()=>BadgeScene.scroll.locked),false);
   assert.equal(await page.locator('.project-flip-layer').count(),0);
   // Directory keeps its own modal/scroll state through the top-layer animation.
   await page.locator('#portfolio-menu-toggle').click();await page.locator('.portfolio-menu-all').click();
   const archive=page.locator('#work-collection a[href$="project=13"]');await archive.scrollIntoViewIfNeeded();
   const top=await page.locator('.portfolio-menu-scroll').evaluate(el=>el.scrollTop);
   await archive.click();await page.waitForURL(u=>u.searchParams.get('project')==='13');
   await page.locator('.scc-detail-close').click();await page.waitForURL(u=>u.pathname.endsWith('/index-badge.html'));await idle();
   assert.equal(await page.locator('#portfolio-menu').evaluate(el=>el.open),true);
   assert.equal(await page.evaluate(()=>BadgeScene.scroll.locked),true,'menu still owns its scroll lock');
   assert.ok(Math.abs(await page.locator('.portfolio-menu-scroll').evaluate(el=>el.scrollTop)-top)<2);
   await page.locator('.portfolio-menu-close').click();await page.waitForFunction(()=>!BadgeScene.scroll.locked);
   console.log('PASS cancellation and archive return preserve modal/focus/scroll ownership');
   // Modified/middle clicks are left uncanceled for the browser's native tab behavior.
   await page.evaluate(()=>{document.activeElement?.blur();BadgeScene.scroll.go(BadgeScene.groups[0].center,true);});
   await page.waitForFunction(()=>Math.abs(BadgeScene.runtime.state.travel-BadgeScene.groups[0].center)<.01 && !BadgeScene.interaction.links[0].hidden);
   const nativeClicks=await page.evaluate(()=>{
    return [{metaKey:true},{ctrlKey:true},{button:1}].map(options=>{
     let prevented;
     const type=options.button===1?'auxclick':'click';
     document.addEventListener(type,e=>{prevented=e.defaultPrevented;e.preventDefault();},{once:true});
     BadgeScene.interaction.links[0].dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,...options}));
     return prevented;
    });
   });
   assert.deepEqual(nativeClicks,[false,false,false]);await idle();
   if(!mobile){
    await page.evaluate(()=>{ProjectFlip.warm(0);BadgeScene.interaction.links[0].click();});
    await page.waitForFunction(()=>ProjectFlip.phase==='opening');
    await page.setViewportSize({width:1280,height:800});await idle();
    assert.ok(page.url().includes('index-badge.html'));assert.equal(await page.evaluate(()=>BadgeScene.scroll.locked),false);
    await home();
    await page.locator('.scene-project-hit').nth(0).click();await page.waitForURL(u=>u.pathname.endsWith('/project-scrollcarousel.html'));
    const token=new URL(page.url()).searchParams.get('return');
    await page.locator('#scc-detail-next').click();await page.waitForURL(u=>u.searchParams.get('project')==='1');
    assert.equal(new URL(page.url()).searchParams.get('return'),token);
    await page.locator('.scc-detail-close').click();await page.waitForURL(u=>u.pathname.endsWith('/index-badge.html'));await idle();
    await page.waitForFunction(()=>document.activeElement===BadgeScene.interaction.links[0]);
    await page.evaluate(()=>{ProjectFlip.warm(0);BadgeScene.interaction.links[0].click();});
    await page.waitForFunction(()=>ProjectFlip.phase==='opening');await page.emulateMedia({reducedMotion:'reduce'});await idle();
    assert.equal(await page.locator('.scene-fallback a').count(),17);assert.equal(await page.locator('.project-flip-layer').count(),0);
    assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).overflow),'hidden');
    console.log('PASS resize/reduced-motion interruption and Next-project return preserve access and original card');
   }
   await context.close();
  }
  const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});reduced.on('pageerror',e=>errors.push(e.message));
  await reduced.goto(base+'/index-badge.html');await reduced.locator('#fallback-independent a').first().click();
  await reduced.waitForURL(u=>u.pathname.endsWith('/project-scrollcarousel.html'));
  assert.equal(await reduced.locator('.project-flip-layer').count(),0);await reduced.locator('.scc-detail-close').click();
  await reduced.waitForURL(u=>u.pathname.endsWith('/index-badge.html'));await reduced.waitForFunction(()=>window.ProjectFlip?.phase==='idle');
  assert.equal(await reduced.locator('.scene-fallback a').count(),17);assert.notEqual(await reduced.evaluate(()=>getComputedStyle(document.body).overflow),'hidden');await reduced.close();
  console.log('PASS reduced motion retains plain navigation and complete HTML access');
  const unavailable=await browser.newPage();unavailable.on('pageerror',e=>errors.push(e.message));
  await unavailable.addInitScript(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('badge-'))throw new Error('Storage denied');return set.call(this,key,value);};});
  await unavailable.goto(base+'/index-badge.html#work-independent');await unavailable.waitForFunction(()=>window.BadgeScene?.runtime?.state?.travel>.59);
  await unavailable.locator('.scene-project-hit').nth(0).click();await unavailable.waitForURL(u=>u.pathname.endsWith('/project-scrollcarousel.html'));
  await unavailable.locator('.scc-detail-close').click();await unavailable.waitForURL(u=>u.pathname.endsWith('/index-badge.html'));
  await unavailable.waitForFunction(()=>window.BadgeScene?.runtime?.state && window.ProjectFlip?.phase==='idle');
  assert.equal(await unavailable.evaluate(()=>BadgeScene.scroll.locked),false);await unavailable.close();
  console.log('PASS unavailable navigation storage still reaches detail and returns without a stuck overlay');
  const failure=await browser.newPage();failure.on('pageerror',e=>errors.push(e.message));
  await failure.route('**/project-scrollcarousel.html',route=>route.request().resourceType()==='fetch'?route.abort():route.continue());
  await failure.goto(base+'/index-badge.html#work-independent');await failure.waitForFunction(()=>window.BadgeScene?.runtime?.state?.travel>.59);
  await failure.locator('.scene-project-hit').nth(0).click();await failure.waitForURL(u=>u.pathname.endsWith('/project-scrollcarousel.html'));
  assert.equal(await failure.locator('.project-flip-layer').count(),0);
  await failure.goBack();await failure.waitForFunction(()=>window.BadgeScene?.runtime?.state && window.ProjectFlip?.phase==='idle');
  assert.equal(await failure.locator('.portfolio-opening').count(),0);assert.equal(await failure.evaluate(()=>BadgeScene.scroll.locked),false);
  console.log('PASS preparation failure falls through to real URL; browser Back unlocks/restores without opening replay');
  const data=await failure.evaluate(()=>SCROLLCAROUSEL_PROJECTS.map(p=>({hero:p.hero,layout:p.detailLayout})));
  for(let i=0;i<data.length;i++){
   await failure.goto(base+'/project-scrollcarousel.html?project='+i,{waitUntil:'domcontentloaded'});
   const image=await failure.locator('#scc-detail-hero-image').evaluate(async img=>{await img.decode();return {src:img.getAttribute('src'),width:img.naturalWidth};});
   assert.equal(image.src,data[i].hero);assert.ok(image.width>0);
   assert.equal(await failure.locator('#scc-detail-content').getAttribute('data-layout'),data[i].layout);
  }
  await failure.close();console.log('PASS all 17 canonical full-resolution Heroes load and template identities are unchanged');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
