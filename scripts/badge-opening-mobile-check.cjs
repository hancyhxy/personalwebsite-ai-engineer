/* Mobile vertical opening / text-only printer control; desktop composition stays intact. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8765',out=process.env.ARTIFACT_DIR;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errors=[];
 if(out)fs.mkdirSync(out,{recursive:true});
 try{
  for(const [width,height] of [[390,844],[375,667],[320,568],[700,600],[701,800],[1440,900]]){
   const mobile=width<=700,p=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile});p.on('pageerror',e=>errors.push(e.message));
   // Extend only the hold for deterministic geometry inspection; production timing is untouched.
   await p.addInitScript(()=>window.BADGE_OPENING_TIMING={holdDuration:3});
   await p.goto(base+'/index-badge.html');
   await p.waitForFunction(()=>{const f=window.BadgeScene?.runtime?.field;return f?.opening.active&&f.opening.wave===1&&f.opening.gather===0});
   const v=await p.evaluate(()=>({vertical:BadgeScene.runtime.field.openingLayout.vertical,tiles:BadgeScene.runtime.field.items.filter(i=>i.featured).map(i=>({index:i.index,rect:i.rect,alpha:i.opacity,rotation:i.mesh.rotation.z})),roles:[...document.querySelectorAll('.opening-role')].map(e=>e.getBoundingClientRect().toJSON()),name:document.querySelector('.opening-name').getBoundingClientRect().toJSON(),skip:document.querySelector('.opening-skip').getBoundingClientRect().toJSON()}));
   assert.equal(v.vertical,mobile);assert.equal(v.tiles.length,11);assert.equal(new Set(v.tiles.map(t=>t.index)).size,11);
   for(const t of v.tiles){assert.ok(Math.abs(t.rect.width/t.rect.height-16/9)<.001);assert.equal(t.rotation,0);assert.equal(t.alpha,1)}
   if(mobile){
    const minTop=Math.min(...v.tiles.map(t=>t.rect.top)),maxBottom=Math.max(...v.tiles.map(t=>t.rect.top+t.rect.height));
    assert.ok(v.roles[0].top>v.name.bottom+10);assert.ok(minTop>v.roles[0].bottom+10);assert.ok(maxBottom<v.roles[1].top-10);assert.ok(v.roles[1].bottom<v.skip.top-10);
    for(const r of v.roles)assert.ok(Math.abs(r.left+r.width/2-width/2)<1);
    assert.ok(maxBottom-minTop>height*.4,'ribbon uses the tall viewport');
    const bend=Math.min(width*.07,height*.055);
    assert.ok(Math.min(...v.tiles.map(t=>t.rect.left+t.rect.width/2))<width/2-bend);
    assert.ok(Math.max(...v.tiles.map(t=>t.rect.left+t.rect.width/2))>width/2+bend);
    for(const t of v.tiles)assert.ok(t.rect.left>=0&&t.rect.left+t.rect.width<=width);
   }else assert.ok(Math.abs(v.roles[0].top+v.roles[0].height/2-v.roles[1].top-v.roles[1].height/2)<1);
   if(out)await p.screenshot({path:path.join(out,`opening-${width}x${height}.png`)});
   await p.locator('.opening-skip').click();await p.waitForSelector('.portfolio-opening',{state:'detached'});
   assert.equal(await p.evaluate(()=>document.body.style.overflow),'');assert.equal(await p.locator('main').evaluate(e=>e.inert),false);
   await p.locator('#resume-section').evaluate(e=>e.scrollIntoView());await p.waitForTimeout(400);
   const arrow=p.locator('#resume-print-trigger > [aria-hidden="true"]');assert.equal(await arrow.isVisible(),!mobile);
   if(width===390){
    await p.locator('#resume-print-trigger').click();const printer=p.frameLocator('#resume-frame');await printer.locator('#printer-stage[data-state="ready"]').waitFor({timeout:20000});
    assert.equal(await arrow.isVisible(),false);assert.equal((await p.locator('#resume-print-trigger').innerText()).trim(),'Download résumé');
    const wait=p.waitForEvent('download');await p.locator('#resume-print-trigger').click();const download=await wait;await download.delete();
    await printer.locator('#printer-stage[data-state="idle"]').waitFor({timeout:15000});assert.equal((await p.locator('#resume-print-trigger').innerText()).trim(),'Print another copy');assert.equal(await arrow.isVisible(),false);
   }
   await p.close();console.log(`PASS ${width}×${height} opening and printer label`);
  }
  const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/index-badge.html');
  await p.waitForFunction(()=>window.BadgeScene?.runtime?.nativeHeld&&!document.querySelector('.portfolio-opening'),null,{timeout:15000});
  assert.equal(await p.evaluate(()=>document.body.style.overflow),'');assert.equal(await p.locator('main').evaluate(e=>e.inert),false);await p.close();
  const resize=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});resize.on('pageerror',e=>errors.push(e.message));await resize.goto(base+'/index-badge.html');await resize.locator('.opening-skip').waitFor({state:'visible'});await resize.setViewportSize({width:700,height:600});await resize.waitForSelector('.portfolio-opening',{state:'detached'});assert.equal(await resize.evaluate(()=>document.body.style.overflow),'');await resize.close();
  assert.deepEqual(errors,[]);console.log('PASS natural mobile handoff, interrupted resize and no page exceptions');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
