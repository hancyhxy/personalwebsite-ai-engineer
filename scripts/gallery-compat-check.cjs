/* All canonical cases + legacy aliases. No external AI requests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const projects = vm.runInNewContext(fs.readFileSync(path.join(root, 'js/scrollcarousel-data.js'), 'utf8') + '\nSCROLLCAROUSEL_PROJECTS');
const gallery = JSON.parse(fs.readFileSync(path.join(root, 'content/gallery.json'), 'utf8'));
const base = (process.env.BASE_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');
(async()=>{
 const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const failures=[];
 try {
  for(const viewport of [{width:1280,height:800},{width:390,height:844}]) {
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});
   page.on('pageerror',e=>failures.push(e.message));
   page.on('response',r=>{if(r.url().startsWith(base+'/')&&r.status()>=400)failures.push(`${r.status()} ${r.url()}`)});
   for(const [index,project] of projects.entries()) {
    const legacy=project.url.replace(/^\.\//,'');
    const route=`project-scrollcarousel.html?project=${index}`;
    assert.equal(gallery.find(p=>p.projectUrl===legacy).publicUrl,route);
    const raw=await page.request.get(`${base}/${legacy}`);
    assert.equal(raw.status(),200);
    const html=await raw.text();
    assert.ok(html.includes(`data-project-index="${index}"`));
    assert.ok(html.includes(`https://xyhan.com/${route}`));
    assert.ok(!/http-equiv="refresh"/.test(html));
    // Direct canonical entry: content, correct template, full-resolution Hero and canonical.
    await page.goto(`${base}/${route}`,{waitUntil:'domcontentloaded'});
    await page.locator('#scc-detail-content h2, #scc-detail-content h3').first().waitFor();
    assert.equal(await page.locator('#scc-detail-title').textContent(),project.title);
    assert.equal(await page.locator('#scc-detail-content').getAttribute('data-layout'),project.detailLayout);
    assert.ok(!(await page.locator('#scc-detail-content').innerText()).includes('The full project story is being prepared.'));
    const hero=page.locator('#scc-detail-hero-image');
    await hero.evaluate(img=>img.decode());
    assert.ok(await hero.evaluate(img=>img.naturalWidth>0));
    assert.ok(!(await hero.getAttribute('src')).includes('/thumbs/'));
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),`https://xyhan.com/${route}`);
    assert.ok(await page.locator('#scc-detail-next').getAttribute('href').then(s=>s.endsWith(`project=${(index+1)%projects.length}`)));
    // Trigger and decode all body images locally. Live runs inspect URLs via HEAD below.
    for(const url of await page.locator('#scc-detail-content video').evaluateAll(videos=>videos.map(v=>v.src))) assert.ok((await page.request.head(url)).ok(),url);
    const images=await page.locator('#scc-detail-content img').evaluateAll(imgs=>imgs.map(img=>img.src));
    for(const url of images) {
     if(process.env.CHECK_MEDIA === 'decode') {
      const broken=await page.locator('#scc-detail-content img').evaluateAll(async imgs=>(await Promise.all(imgs.map(async img=>{img.loading='eager';try{await img.decode();return null}catch{return img.src}}))).filter(Boolean));
      failures.push(...broken.map(url=>'Image decode failed: '+url));
     }
     else if(!(await page.request.head(url)).ok()) failures.push('Missing image: '+url);
     if(process.env.CHECK_MEDIA === 'decode') break;
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${index} overflow at ${viewport.width}`);
    if(process.env.SHOTS_DIR) {
     fs.mkdirSync(process.env.SHOTS_DIR,{recursive:true});
     await page.screenshot({path:path.join(process.env.SHOTS_DIR,`${viewport.width}-${index}.png`)});
    }
    await page.locator('.scc-detail-close').click();
    await page.waitForURL(url=>url.pathname.endsWith('/index.html'));
    assert.equal(new URL(page.url()).hash,'#work-independent');
    // Both historic forms, tracking and malicious/wrong project parameters retain path identity.
    for(const alias of [legacy,legacy.replace(/index\.html$/,''),legacy.replace(/\/index\.html$/,'')]) {
     await page.goto(`${base}/${alias}?utm_source=chatgpt.com&project=999`,{waitUntil:'domcontentloaded'});
     await page.waitForURL(url=>url.pathname.endsWith('/project-scrollcarousel.html')&&url.searchParams.get('project')===String(index));
     assert.equal(new URL(page.url()).searchParams.get('utm_source'),'chatgpt.com');
     await page.locator('#scc-detail-content h2, #scc-detail-content h3').first().waitFor();
     assert.equal(await page.locator('#scc-detail-title').textContent(),project.title);
    }
    console.log(`CHECKED ${viewport.width}px case ${index}: ${project.title}; current + 3 aliases, content, media, layout, return`);
   }
   await page.close();
  }
  // location.replace must not trap a visitor in a legacy/current Back-button loop.
  const page=await browser.newPage({reducedMotion:'reduce'});
  await page.goto(`${base}/index.html#work-independent`);
  await page.goto(`${base}/gallery/portfolio-ai-assistant/?utm_source=chatgpt.com`);
  await page.waitForURL(url=>url.pathname.endsWith('/project-scrollcarousel.html'));
  await page.goBack();
  assert.ok(new URL(page.url()).pathname.endsWith('/index.html'));
  console.log('PASS legacy redirect preserves native Back history');
  // Published home aliases must retain their own same-tab return state, including root '/'.
  for(const entry of ['','index.html','index-badge.html']) {
   await page.goto(`${base}/${entry}#work-independent`);
   await page.locator('#fallback-independent a').first().click();
   await page.waitForURL(url=>url.pathname.endsWith('/project-scrollcarousel.html'));
   const home=await page.locator('.scc-detail-close').getAttribute('href');
   assert.equal(new URL(home).pathname,new URL(`${base}/${entry}`).pathname);
   assert.ok(new URL(home).searchParams.has('restore'));
   await page.locator('.scc-detail-close').click();
   await page.waitForURL(url=>url.pathname===new URL(`${base}/${entry}`).pathname);
   console.log(`PASS return snapshot: /${entry}`);
  }
  // Static legacy content stays readable when JavaScript cannot run (17 full cases + 1 link fallback).
  const nojs=await browser.newPage({javaScriptEnabled:false});
  for(const [index,project] of projects.entries()) {
   await nojs.goto(new URL(project.url,base+'/').href);
   assert.ok(new URL(nojs.url()).pathname.includes('/gallery/'));
   assert.ok((await nojs.locator('body').innerText()).length > 20, `Readable no-JS fallback: ${project.title}`);
   if(index!==17) assert.ok(await nojs.locator('img').count()>0, `Static case imagery: ${project.title}`);
  }
  console.log('PASS all 18 no-JavaScript legacy fallbacks');
  await nojs.goto(`${base}/project-scrollcarousel.html?project=0`);
  assert.equal(await nojs.locator('section[aria-label="Case study text editions"] a').count(),18);
  for(const href of await nojs.locator('section[aria-label="Case study text editions"] a').evaluateAll(a=>a.map(e=>e.href))) assert.ok((await nojs.request.get(href)).ok(),href);
  console.log('PASS canonical no-JavaScript fallback: 18 readable case texts');
  assert.deepEqual(failures,[]);
  console.log('PASS all 18 cases × desktop/mobile, 54 legacy aliases, media, return and no-JS checks');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
