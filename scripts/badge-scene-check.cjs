/* BASE_URL, PLAYWRIGHT_MODULE, CHROME_PATH, ARTIFACT_DIR. Desktop overview + retained functional paths. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
const entry = process.env.BADGE_ENTRY || 'index-badge.html', out = process.env.ARTIFACT_DIR;
const checks = [], errors = [];
function pass(name) { checks.push(name); console.log('PASS', name); }
function overlap(a,b) { return a.left < b.left+b.width && a.left+a.width > b.left && a.top < b.top+b.height && a.top+a.height > b.top; }
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const watch=p=>p.on('pageerror',e=>errors.push(e.message));
  try {
    if(out)fs.mkdirSync(out,{recursive:true});
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});watch(page);
    await page.goto(base+'/'+entry,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.opening-skip',{timeout:5000});await page.locator('.opening-skip').click();
    await page.waitForFunction(()=>window.BadgeScene?.runtime?.field&&!BadgeScene.runtime.field.opening.active);
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
    assert.equal(await page.locator('#portrait').evaluate(e=>e===document.activeElement),true);
    pass('Skip restores scrolling and keyboard focus');
    await page.mouse.move(0,0);await page.evaluate(async()=>{const i=new Image();i.src='assets/hero-portrait/right.webp';await i.decode();});await page.waitForTimeout(150);await page.locator('#portrait').focus();
    await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>/right\.webp/.test(document.querySelector('#face').src));await page.keyboard.press('Home');
    assert.equal(await page.locator('main').evaluate(e=>e.inert),false);
    pass('Badge directional portrait and main interactivity preserved');
    await page.evaluate(()=>document.fonts.ready);
    const go=async n=>{await page.evaluate(t=>BadgeScene.scroll.go(t,true),n);try{await page.waitForFunction(t=>Math.abs(BadgeScene.runtime.state.travel-t)<.002,n,{timeout:5000});}catch(e){console.error('Scroll state',await page.evaluate(()=>({travel:BadgeScene.runtime.state.travel,y:scrollY,start:BadgeScene.scroll.start,height:innerHeight,locked:BadgeScene.scroll.locked,fonts:document.fonts.status})),n);throw e;}await page.waitForTimeout(120);};
    const centers=await page.evaluate(()=>BadgeScene.groups.map(g=>({id:g.id,at:g.center,count:g.projects.length})));
    await page.mouse.move(720,500);await go(centers[0].at);await page.waitForTimeout(500);
    const contract=await page.evaluate(()=>({type:BadgeScene.runtime.rig.camera.type,total:BadgeScene.projects.length,groups:BadgeScene.groups.map(g=>g.projects.length),featured:BadgeScene.featured,archived:BadgeScene.archived,duration:BadgeScene.duration,heroOverlap:BadgeScene.timing.heroOverlap,physicalHeight:document.querySelector('#work-story').getBoundingClientRect().height/innerHeight,blanks:BadgeScene.runtime.background.mesh.isInstancedMesh,old:[...document.scripts].some(s=>/badge-webgl|badge-scroll-stage/.test(s.src))}));
    assert.equal(contract.type,'PerspectiveCamera');assert.equal(contract.total,16);assert.deepEqual(contract.groups,[4,4,3]);assert.equal(contract.featured.length,11);assert.deepEqual(contract.archived,[10,11,13,14,15]);assert.equal(contract.old,false);assert.equal(contract.blanks,true);assert.ok(contract.duration<=4);assert.ok(Math.abs(contract.physicalHeight+contract.heroOverlap-contract.duration)<.002);
    pass('Three overview chapters, 11 featured / 5 archived, <=4 viewport travel; no legacy driver');
    const snapshot=()=>page.evaluate(()=>{
      const r=BadgeScene.runtime;
      return {focus:r.state.focused,group:r.state.group.id,header:r.reading.headers.find(h=>h.group===r.state.group).el.getBoundingClientRect().toJSON(),items:r.field.items.filter(i=>i.group===r.state.group).map(i=>({index:i.index,rect:i.rect,neutral:r.rig.rect(i.mesh,true),dom:BadgeScene.interaction.links[i.index].getBoundingClientRect().toJSON(),label:BadgeScene.interaction.links[i.index].querySelector('span').getBoundingClientRect().toJSON(),alpha:i.opacity,color:i.mesh.material.color.getHex(),owner:i.owner,visible:i.mesh.visible})),hiddenArchive:BadgeScene.archived.every(i=>!r.field.items[i].mesh.visible&&BadgeScene.interaction.links[i].hidden&&!r.field.items[i].mesh.material.map)};
    });
    for(const size of [{width:1440,height:1000},{width:1280,height:800}]){
      await page.setViewportSize(size);await page.mouse.move(size.width/2,size.height/2);await page.waitForTimeout(900);
      for(const c of centers){
        await go(c.at);const s=await snapshot();assert.equal(s.focus,-1);assert.equal(s.items.length,c.count);assert.ok(s.hiddenArchive);
        for(const i of s.items){
          assert.equal(i.alpha,1);assert.equal(i.color,0xffffff);assert.equal(i.owner,'mesh');assert.ok(i.visible);
          assert.ok(Math.abs(i.rect.width/i.rect.height-16/9)<.002);
          for(const k of ['left','top','width','height'])assert.ok(Math.abs(i.rect[k]-i.dom[k])<1,'projected link '+k);
          assert.ok(i.rect.left>=0&&i.rect.left+i.rect.width<=size.width&&i.rect.top>=0&&i.label.bottom<=size.height+1,'chapter fits viewport '+c.id+' '+i.index);
          assert.ok(!overlap(i.rect,s.header)&&!overlap(i.label,s.header),'copy exclusion '+c.id+' '+i.index);
        }
        for(let i=0;i<s.items.length;i++)for(let j=i+1;j<s.items.length;j++)assert.ok(!overlap(s.items[i].rect,s.items[j].rect));
        if(out&&size.width===1440)await page.screenshot({path:path.join(out,c.id+'-overview.png')});
      }
    }
    pass('All 4/4/3 projects simultaneously visible, full color, non-overlapping, correctly linked at two desktop sizes');
    await page.setViewportSize({width:1440,height:1000});await page.mouse.move(720,500);await go(centers[0].at);
    const before=await snapshot();await go(centers[0].at+.1);const after=await snapshot();
    assert.equal(after.focus,-1);assert.deepEqual(after.items.map(i=>i.index),before.items.map(i=>i.index));
    const expectedTravel=await page.evaluate(t=>(BadgeScene.presentationTravel(t+.1)-BadgeScene.presentationTravel(t))*innerHeight*BadgeScene.motion.desktop,centers[0].at);
    assert.ok(expectedTravel>5&&expectedTravel<25,'chapter overview is a reading beat, not an artificial scroll lock');
    assert.ok(Math.abs(before.items[0].rect.top-after.items[0].rect.top-expectedTravel)<1);
    assert.ok(Math.abs(before.header.top-after.header.top-expectedTravel)<1);
    assert.equal(await page.locator('.scene-featured').count(),0);
    pass('Overview slows to a reading beat; real cards and copy share the same reversible motion');
    await go(centers[0].at);await page.mouse.move(720,80);await page.waitForTimeout(700);
    const pointerSample=()=>page.evaluate(()=>({camera:BadgeScene.runtime.rig.camera.position.toArray(),world:BadgeScene.runtime.field.items[3].mesh.position.toArray(),heading:BadgeScene.runtime.reading.headers[0].el.getBoundingClientRect().toJSON()}));
    const p0=await pointerSample();await page.mouse.move(1250,80);await page.waitForTimeout(700);const p1=await pointerSample();
    assert.ok(p1.camera[0]>p0.camera[0]+.05);assert.deepEqual(p0.world,p1.world);assert.ok(Math.abs(p0.heading.left-p1.heading.left)<1);
    pass('Perspective pointer spring retained; chapter copy does not wobble');
    await page.mouse.move(720,500);await page.waitForTimeout(500);
    const edges=await page.evaluate(()=>BadgeScene.groups.slice(0,-1).map((g,i)=>({at:g.end,from:g.id,to:BadgeScene.groups[i+1].id})));
    for(const edge of edges){await go(edge.at);const visible=await page.evaluate(()=>BadgeScene.runtime.field.items.filter(i=>i.featured&&i.rect.top<innerHeight&&i.rect.top+i.rect.height>0).map(i=>({group:i.group.id,alpha:i.opacity})));assert.ok(visible.some(i=>i.group===edge.from&&i.alpha>.2));assert.ok(visible.some(i=>i.group===edge.to&&i.alpha>.2));}
    pass('Both chapter boundaries keep outgoing and incoming works together');
    await go(centers[2].at);await go(centers[0].at);const back=await snapshot();
    for(let i=0;i<4;i++)for(const k of ['left','top','width','height'])assert.ok(Math.abs(back.items[i].neutral[k]-before.items[i].neutral[k])<1);
    pass('Reverse scroll restores the same chapter composition');
    await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(250);assert.ok(Math.abs(await page.evaluate(()=>BadgeScene.runtime.state.travel)-centers[0].at)<.01);
    await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(250);
    pass('Resize preserves narrative progress');
    await page.locator('.scene-chapter-nav a[href="#work-experimental"]').focus();await page.keyboard.press('Enter');
    await page.waitForFunction(t=>Math.abs(BadgeScene.runtime.state.travel-t)<.02,centers[2].at);
    assert.equal(await page.locator('.scene-overview-heading[data-group="experimental"] h2').textContent(),'Experimental Practice');
    assert.equal(await page.locator('.scene-chapter-nav a[href="#work-parsons"]').count(),0);
    pass('Keyboard chapter navigation uses Experimental Practice');
    assert.ok((await page.evaluate(()=>BadgeScene.projects[9].sceneNote)).includes('not a deployed museum system'));
    assert.ok((await page.locator('.scene-project-hit').nth(9).textContent()).includes('Concept'));
    pass('Museum Tour is explicitly labeled a concept proposal');
    await go(centers[0].at);
    assert.equal(await page.locator('.badge-project-panel,.badge-project-enter').count(),0);
    pass('Intermediate preview and Enter control removed');
    for(const index of [0,3]){
      const originY=await page.evaluate(()=>scrollY);
      await page.evaluate(i=>BadgeScene.interaction.open(i),index);
      assert.equal(await page.locator('iframe[src*="measure="]').count(),0);
      await page.waitForURL(url=>url.pathname.endsWith('/project-scrollcarousel.html')&&url.searchParams.get('project')===String(index));
      await page.locator('#scc-detail-hero-image').evaluate(img=>img.decode());
      const image=await page.locator('#scc-detail-hero-image').evaluate(img=>({src:img.getAttribute('src'),width:img.naturalWidth}));
      assert.ok(!image.src.includes('/thumbs/'));assert.ok(image.width>800);
      assert.equal(await page.locator('.scc-detail-transition-cover,.scene-detail-flight').count(),0);await page.waitForFunction(()=>document.querySelector('#scc-detail-content h2, #scc-detail-content h3'));
      assert.equal(await page.locator('#scc-detail-content').getAttribute('data-layout'),index===0?'stacked':'two-column');
      pass('Detail '+index+': full-resolution Hero, one-step navigation, original template retained');
      await page.locator('.scc-detail-close').click();await page.waitForURL(url=>url.pathname.endsWith('/'+entry));
      await page.waitForFunction(y=>Math.abs(scrollY-y)<2 && window.ProjectFlip?.phase==='idle',originY);
      assert.equal(await page.locator('.portfolio-opening').count(),0);
      await go(centers[0].at);
    }
    await page.goto(base+'/'+entry+'#work-parsons');await page.waitForFunction(()=>window.BadgeScene?.runtime?.state?.group.id==='experimental');
    pass('Old Parsons deep link still reaches the renamed chapter');
    await go(contract.duration);
    assert.equal(await page.locator('#portfolio-menu').evaluate(e=>e.open),false);
    await page.locator('#portfolio-menu-toggle').click();await page.locator('.portfolio-menu-all').click();
    assert.equal(await page.locator('#work-collection .work-item').count(),16);
    for(const i of contract.archived)assert.equal(await page.locator('#work-collection .work-item[href$="project='+i+'"]').count(),1);
    await page.locator('#work-collection .work-item[href$="project=13"]').click();
    await page.waitForURL(url=>url.searchParams.get('project')==='13');
    await page.locator('#scc-detail-hero-image').evaluate(img=>img.decode());
    await page.locator('.scc-detail-close').click();await page.waitForURL(url=>url.pathname.endsWith('/'+entry));
    await page.waitForFunction(()=>document.querySelector('#portfolio-menu')?.open);
    pass('Menu archive retains 16 links; archive-only detail returns to the open directory');
    await page.locator('.portfolio-menu-close').click();
    await page.locator('#agent-fab').click();assert.equal(await page.locator('#agent-panel').isVisible(),true);assert.equal(await page.locator('.agent-providers a').count(),3);const askHref=await page.locator('[data-provider="chatgpt"]').getAttribute('href');assert.ok(new URL(askHref).searchParams.get('q').includes('https://hancyhxy.github.io/personalwebsite-ai-engineer/'));await page.keyboard.press('Escape');
    pass('Ask AI panel and all three providers preserved');
    await page.locator('#resume-link').click();await page.waitForFunction(()=>typeof document.querySelector('#resume-frame').contentWindow?.resumePressPrimary==='function',null,{timeout:20000});
    const printer=page.frameLocator('#resume-frame');await printer.locator('#printer-stage[data-state="idle"]').waitFor();
    assert.equal(await page.locator('#resume-print-trigger').isVisible(),true);assert.equal(await page.locator('.resume-printer-actions').locator('button,a').count(),1);assert.equal(await printer.locator('#printer-button').getAttribute('tabindex'),'-1');
    await page.waitForFunction(()=>document.getElementById('resume-identity-word').textContent!=='product',null,{timeout:5000});
    await page.locator('#resume-print-trigger').click();await printer.locator('#printer-stage[data-state="ready"]').waitFor({timeout:20000});
    const fit=await page.locator('#resume-frame').evaluate(f=>({height:f.getBoundingClientRect().height,app:f.contentDocument.querySelector('.resume-app').getBoundingClientRect().height}));assert.ok(fit.height>=fit.app);
    pass('Learn more only navigates; visible identity typing and explicit printer start fit the iframe');
    await printer.locator('#ticket-front').click();assert.equal(await printer.locator('#resume-reader').evaluate(e=>e.open),true);await printer.locator('#reader-close').click();
    const corner=await printer.locator('#corner-handle').boundingBox();await page.mouse.move(corner.x+corner.width/2,corner.y+corner.height/2);await page.mouse.down();await page.mouse.move(corner.x+corner.width/2+18,corner.y+corner.height/2+18,{steps:3});await page.mouse.up();await printer.locator('#printer-stage[data-state="ready"]').waitFor({timeout:10000});
    pass('Résumé reading and short paper drag preserved');
    const downloadPromise=page.waitForEvent('download',{timeout:20000});await page.locator('#resume-print-trigger').click();const download=await downloadPromise;assert.ok(/\.pdf$/i.test(download.suggestedFilename()));await download.delete();
    await printer.locator('#printer-stage[data-state="idle"]').waitFor({timeout:10000});await page.locator('#resume-print-trigger').click();await printer.locator('#printer-stage[data-state="ready"]').waitFor({timeout:20000});
    pass('Single résumé control preserves print, download and replay sequence');
    const intro=await browser.newPage({viewport:{width:1280,height:800}});watch(intro);await intro.goto(base+'/'+entry,{waitUntil:'domcontentloaded'});await intro.waitForFunction(()=>window.BadgeScene?.runtime?.field);await intro.locator('.opening-skip').waitFor({state:'visible',timeout:5000});
    await intro.evaluate(()=>{window.__introCheck={bad:0,last:null,after:null};function sample(){const r=BadgeScene.runtime,o=r.field.opening,items=r.field.items.filter(i=>i.featured);if(o.active){if(Math.abs(o.land-o.size)>.000001)__introCheck.bad++;if(o.land===1)__introCheck.last=items.map(i=>({...i.rect}));for(const i of items)if(Math.abs(i.rect.width/i.rect.height-16/9)>.001)__introCheck.bad++;requestAnimationFrame(sample)}else requestAnimationFrame(()=>{__introCheck.after=items.map(i=>({...i.rect}))})}sample()});
    await intro.waitForFunction(()=>window.__introCheck?.after,{timeout:15000});const continuity=await intro.evaluate(()=>__introCheck);assert.equal(continuity.bad,0);assert.ok(continuity.last);assert.equal(continuity.after.length,11);
    for(let i=0;i<11;i++)for(const k of ['left','top','width','height'])assert.ok(Math.abs(continuity.last[i][k]-continuity.after[i][k])<1);
    pass('Opening uses 11 curated images, 16:9 throughout, synchronized landing without geometry jump');
    const cdp=await intro.context().newCDPSession(intro);
    await intro.locator('#resume-section').scrollIntoViewIfNeeded();const beforeReload=await intro.evaluate(()=>scrollY);assert.ok(beforeReload>800);
    let navigation=intro.waitForNavigation({waitUntil:'load'});await cdp.send('Page.reload',{ignoreCache:true});await navigation;await intro.waitForTimeout(600);
    assert.equal(await intro.evaluate(()=>performance.getEntriesByType('navigation')[0]?.type),'reload');assert.ok(await intro.evaluate(()=>scrollY>innerHeight));assert.equal(await intro.locator('.portfolio-opening').count(),0);assert.equal(await intro.evaluate(()=>document.documentElement.classList.contains('opening-pending')||document.body.classList.contains('opening-active')),false);
    await intro.evaluate(()=>scrollTo(0,0));navigation=intro.waitForNavigation({waitUntil:'load'});await cdp.send('Page.reload',{ignoreCache:true});await navigation;await intro.locator('.opening-skip').waitFor({state:'visible',timeout:5000});assert.equal(await intro.evaluate(()=>scrollY),0);await intro.locator('.opening-skip').click();
    pass('Non-top reload preserves position without overlap; top reload deliberately replays the opening');await intro.close();
    // Mobile art direction is deferred: only functional/static access is asserted here.
    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});watch(mobile);await mobile.goto(base+'/'+entry+'#work-ux');await mobile.waitForFunction(()=>window.BadgeScene?.runtime?.state);
    assert.equal(await mobile.evaluate(()=>BadgeScene.scroll.lenis.options.syncTouch),false);assert.equal(await mobile.locator('.scene-fallback a').count(),16);await mobile.close();
    pass('Mobile native touch wiring and complete fallback content retained; no mobile visual acceptance claimed');
    const fallback=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});watch(fallback);await fallback.goto(base+'/'+entry);await fallback.waitForSelector('.scene-fallback a');
    assert.equal(await fallback.locator('.scene-fallback a').count(),16);assert.equal(await fallback.locator('#fallback-experimental a').count(),3);assert.equal(await fallback.locator('#fallback-archive a').count(),5);assert.equal(await fallback.locator('.badge-scene-canvas').count(),0);assert.notEqual(await fallback.evaluate(()=>getComputedStyle(document.body).overflow),'hidden');
    pass('Reduced-motion fallback exposes 11 selections plus 5 archive entries without locking scroll');await fallback.close();
    await page.evaluate(()=>BadgeScene.runtime.renderer.getContext().getExtension('WEBGL_lose_context').loseContext());await page.waitForSelector('.scene-fallback-mode');assert.equal(await page.locator('.scene-fallback').isVisible(),true);
    pass('WebGL context loss fails open to complete HTML content');
    const missing=await browser.newPage();watch(missing);await missing.route('**/assets/images/thumbs/Rider-Dispatch-Scheduling-Platform-thumb.jpg',r=>r.abort());await missing.goto(base+'/'+entry);await missing.waitForSelector('.scene-fallback-mode');assert.equal(await missing.locator('.scene-fallback a').count(),16);assert.notEqual(await missing.evaluate(()=>getComputedStyle(document.body).overflow),'hidden');await missing.close();
    pass('Texture failure preserves all project routes and unlocks scrolling');
    assert.deepEqual(errors,[]);pass('No uncaught browser exceptions');
    if(out)fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks,errors,contract},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
