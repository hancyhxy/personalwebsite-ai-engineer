/* Synthetic orientation/permission regressions; physical iPhone Safari still needs acceptance. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   sessionStorage.setItem('portfolio-intro-played','1');window.permissionCalls=0;window.permissionResult='prompt';
   Object.defineProperty(DeviceOrientationEvent,'requestPermission',{configurable:true,value:()=>{
    permissionCalls++;
    if(permissionResult==='prompt')return navigator.userActivation.isActive?Promise.resolve('granted'):Promise.reject(new DOMException('Requires a click','NotAllowedError'));
    return permissionResult==='error'?Promise.reject(Error('blocked')):Promise.resolve(permissionResult);
   }});
  });
  await page.goto(base+'/index-badge.html');await page.evaluate(()=>document.fonts.ready);
  const controls=page.locator('.badge-tilt-controls'),button=page.locator('.badge-tilt-toggle');
  await controls.waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('.badge-tilt-controls').dataset.state==='permission-needed');
  assert.equal(await page.evaluate(()=>permissionCalls),1,'check existing permission once without prompting');
  const send=async(beta,gamma)=>{await page.evaluate(({beta,gamma})=>dispatchEvent(Object.assign(new Event('deviceorientation'),{beta,gamma})),{beta,gamma});await page.waitForTimeout(70)};
  const face=async name=>{await page.waitForFunction(name=>document.querySelector('#face').src.endsWith('/'+name+'.webp'),name)};
  await send(60,30);await face('center');
  await button.tap();assert.equal(await page.evaluate(()=>permissionCalls),2);
  await send(60,0);await face('center');await send(62,2);await face('center');
  for(const [beta,gamma,name] of [[30,-30,'up-left'],[30,0,'up'],[30,30,'up-right'],[60,-30,'left'],[60,0,'center'],[60,30,'right'],[90,-30,'down-left'],[90,0,'down'],[90,30,'down-right']]){await send(beta,gamma);await face(name);}
  await page.waitForTimeout(700);
  const transform=await page.locator('#badge').evaluate(e=>e.style.transform),angles=[...transform.matchAll(/rotate[XY]\(([-\d.]+)deg\)/g)].map(m=>Number(m[1]));
  assert.ok(Math.abs(angles[0])<=4.6&&Math.abs(angles[1])<=6.9,transform);
  await page.locator('.badge-tilt-recenter').tap();await send(95,35);await face('center');await send(95,65);await face('right');
  await page.evaluate(()=>Object.defineProperty(screen.orientation,'angle',{configurable:true,value:90}));
  await send(60,0);await face('center');await send(90,0);await face('right');
  await page.locator('#fallback-ux').evaluate(e=>e.scrollIntoView());await page.waitForFunction(()=>document.querySelector('.badge-tilt-controls').dataset.state==='paused');
  await send(90,50);await face('center');
  await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>document.querySelector('.badge-tilt-controls').dataset.state==='waiting');
  await send(50,0);await send(80,0);await face('right');
  await page.evaluate(()=>dispatchEvent(new Event('blur')));await send(20,0);await face('center');
  await page.evaluate(()=>dispatchEvent(new Event('focus')));await send(50,0);await face('center');
  await button.tap();assert.equal(await button.getAttribute('aria-pressed'),'false');await send(80,50);await face('center');
  await page.evaluate(()=>permissionResult='denied');await button.tap();assert.equal(await controls.getAttribute('data-state'),'denied');await send(80,50);await face('center');
  await page.evaluate(()=>permissionResult='error');await button.tap();assert.equal(await controls.getAttribute('data-state'),'denied');
  await page.evaluate(()=>permissionResult='granted');await button.tap();await send(60,0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.badge-tilt-controls').dataset.state==='reduced');assert.equal(await button.isDisabled(),true);await send(90,0);await face('center');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>document.querySelector('.badge-tilt-controls').dataset.state==='unavailable',null,{timeout:6000});
  assert.equal(await button.getAttribute('aria-pressed'),'false');
  await page.setViewportSize({width:1100,height:800});assert.equal(await controls.isVisible(),false);
  await page.close();console.log('PASS first-time permission fallback, nine directions, dead zone, clamp, recenter, rotation, pause, disable, denial, reduce motion and no-data fallback');
  for(const mode of ['granted','no-permission-api']){
   const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(mode=>{
    sessionStorage.setItem('portfolio-intro-played','1');window.permissionCalls=0;
    Object.defineProperty(DeviceOrientationEvent,'requestPermission',{configurable:true,value:mode==='granted'?()=>{permissionCalls++;return Promise.resolve('granted')}:undefined});
   },mode);
   await p.goto(base+'/index-badge.html');
   await p.waitForFunction(()=>document.querySelector('.badge-tilt-controls')?.dataset.state==='waiting');
   assert.equal(await p.locator('.badge-tilt-toggle').getAttribute('aria-pressed'),'true','auto-start without a click');
   await p.evaluate(()=>dispatchEvent(Object.assign(new Event('deviceorientation'),{beta:60,gamma:0})));await p.waitForTimeout(100);
   for(let i=0;i<5;i++){await p.evaluate(()=>dispatchEvent(Object.assign(new Event('deviceorientation'),{beta:60,gamma:30})));await p.waitForTimeout(100)}
   await p.waitForFunction(()=>document.querySelector('#face').src.endsWith('/right.webp'));
   assert.equal(await p.evaluate(()=>permissionCalls),mode==='granted'?1:0);
   await p.locator('.badge-tilt-toggle').tap();await p.reload();await p.waitForTimeout(700);
   assert.equal(await p.evaluate(()=>permissionCalls),0,'explicit off survives a same-tab reload');
   assert.equal(await p.locator('.badge-tilt-toggle').getAttribute('aria-pressed'),'false');
   await p.close();console.log('PASS automatic '+mode+' and remembered disable');
  }
  for(const kind of ['unsupported','insecure']){
   const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(kind=>{sessionStorage.setItem('portfolio-intro-played','1');if(kind==='unsupported')Object.defineProperty(window,'DeviceOrientationEvent',{value:undefined});else Object.defineProperty(window,'isSecureContext',{value:false})},kind);
   await p.goto(base+'/index-badge.html');await p.locator('.badge-tilt-controls').waitFor({state:'visible'});
   assert.equal(await p.locator('.badge-tilt-toggle').isDisabled(),true);assert.equal(await p.locator('.badge-tilt-controls').getAttribute('data-state'),'unavailable');
   assert.notEqual(await p.evaluate(()=>document.body.style.overflow),'hidden');await p.close();console.log('PASS '+kind);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
