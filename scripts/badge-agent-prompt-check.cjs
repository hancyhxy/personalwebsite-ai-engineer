/* Public handoff only: never sends a prompt to an AI provider. */
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try {
  for(const entry of ['index.html','index-badge.html']) {
   const page=await browser.newPage({reducedMotion:'reduce'});
   await page.addInitScript(()=>{
    window.copiedPrompt='';
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedPrompt=text}}});
   });
   await page.goto(`${base}/${entry}`);
   await page.locator('#agent-fab').click();
   const prompt=await page.locator('#agent-prompt').inputValue();
   assert.ok(prompt.includes('https://xyhan.com/project-scrollcarousel.html?project=0'));
   assert.ok(!prompt.includes('/gallery/'));
   assert.ok(prompt.split(/\s+/).length < 120);
   for(const internal of ['llms.txt','GitHub','not evidenced','fit percentage','hiring verdict']) assert.ok(!prompt.includes(internal),internal);
   assert.ok(!prompt.includes('hancyhxy.github.io'));
   for(const phrase of ['short introduction','company and role','job description','two useful projects with their full URLs','grounded in her published work','not your research process']) assert.ok(prompt.includes(phrase),phrase);
   for(const provider of ['chatgpt','claude']) {
    const url=new URL(await page.locator(`[data-provider="${provider}"]`).getAttribute('href'));
    assert.equal(url.searchParams.get('q'),prompt);
   }
   await page.locator('#copy-prompt').click();
   assert.equal(await page.evaluate(()=>window.copiedPrompt),prompt);
   assert.equal(await page.locator('[data-provider="gemini"]').getAttribute('href'),'https://gemini.google.com/app');
   // Run Gemini's local copy handler while preventing actual external navigation.
   await page.locator('[data-provider="gemini"]').evaluate(el=>{el.addEventListener('click',e=>e.preventDefault(),{once:true});el.click()});
   assert.equal(await page.evaluate(()=>window.copiedPrompt),prompt);
   await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});document.execCommand=()=>false});
   await page.locator('#copy-prompt').click();
   assert.equal(await page.locator('#agent-copy-fallback').isVisible(),true);
   assert.equal(await page.locator('#agent-prompt').inputValue(),prompt);
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#agent-panel').isHidden(),true);
   console.log(`PASS ${entry}: domain, recruiter prompt, provider parity, copy, Gemini and manual fallback`);
   await page.close();
  }
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
