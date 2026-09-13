'use strict';
(()=>{
const panel=document.getElementById('agent-panel'),fab=document.getElementById('agent-fab'),hero=document.getElementById('agent-link'),close=document.getElementById('close-agent'),copy=document.getElementById('copy-prompt'),text=document.getElementById('agent-prompt'),status=document.getElementById('copy-status');
// Only the current public portfolio deployment. No local résumé contents or private contact details.
const prompt='This is a public portfolio published by its owner. Read the current portfolio at https://hancyhxy.github.io/personalwebsite-ai-engineer/ and tell me about Xinyi Han, a designer and AI engineer. Use this deployment only, including https://hancyhxy.github.io/personalwebsite-ai-engineer/project-scrollcarousel.html?project=16, https://hancyhxy.github.io/personalwebsite-ai-engineer/project-scrollcarousel.html?project=17, https://hancyhxy.github.io/personalwebsite-ai-engineer/gallery/customer-service-workspace-chatbot/, https://hancyhxy.github.io/personalwebsite-ai-engineer/gallery/Content-Driven-Food-Delivery-Experience/, and https://hancyhxy.github.io/personalwebsite-ai-engineer/gallery/portfolio-ai-assistant/. Summarize her experience, what she builds, and the skills demonstrated by her work. Link each factual claim to a source page. If I provide a job description, compare it with the published evidence and suggest useful interview questions. If you cannot access a page or verify a claim, say so; do not invent experience, results, or endorsements.';
const encoded=encodeURIComponent(prompt);
const links={chatgpt:`https://chatgpt.com/?q=${encoded}&hints=search`,claude:`https://claude.ai/new?q=${encoded}`,gemini:'https://gemini.google.com/app'};
const providerNames={chatgpt:'ChatGPT',claude:'Claude',gemini:'Gemini — copy question, open, then paste'};
panel.querySelectorAll('[data-provider]').forEach(a=>{a.href=links[a.dataset.provider];a.title=providerNames[a.dataset.provider]});text.value=prompt;
const triggers=[fab,hero].filter(Boolean);
let opener=fab,pinned=false,closeTimer=0;
function cancelClose(){clearTimeout(closeTimer);closeTimer=0}
function show(trigger,lock=false){cancelClose();opener=trigger;if(lock)pinned=true;panel.hidden=false;panel.dataset.state=pinned?'pinned':'preview';for(const t of triggers)t.setAttribute('aria-expanded','true');fab.classList.add('is-awake')}
function hide(restore=false){cancelClose();if(panel.hidden)return;pinned=false;panel.hidden=true;delete panel.dataset.state;for(const t of triggers)t.setAttribute('aria-expanded','false');fab.classList.remove('is-awake');if(restore)opener.focus({preventScroll:true})}
function scheduleClose(){cancelClose();if(pinned)return;closeTimer=setTimeout(()=>{if(!pinned&&!panel.contains(document.activeElement))hide(false)},260)}
for(const trigger of triggers){
 trigger.title='Ask an AI about me — opens your assistant with a ready-made question';trigger.setAttribute('aria-controls','agent-panel');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-haspopup','dialog');
 trigger.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')show(trigger)});
 trigger.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')scheduleClose()});
 trigger.addEventListener('click',()=>{if(pinned&&!panel.hidden){hide(true);return}show(trigger,true);if(trigger.matches(':focus-visible'))panel.querySelector('[data-provider]').focus({preventScroll:true})});
}
panel.addEventListener('pointerenter',cancelClose);panel.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')scheduleClose()});panel.addEventListener('focusin',cancelClose);
panel.addEventListener('focusout',()=>{if(!pinned)scheduleClose()});
close.addEventListener('click',()=>hide(true));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();hide(true)}});
document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!triggers.some(t=>t.contains(e.target)))hide(false)});
document.addEventListener('focusin',e=>{if(!panel.hidden&&!panel.contains(e.target)&&e.target!==fab&&e.target!==hero)hide(false)});
// Coalesced pointer updates only; no perpetual JavaScript animation loop.
const orb=fab.querySelector('.agent-orb'),motion=matchMedia('(prefers-reduced-motion: reduce)');let eyeFrame=0,pointer=null;
function neutralEyes(){pointer=null;if(eyeFrame)cancelAnimationFrame(eyeFrame);eyeFrame=0;orb.style.setProperty('--eye-x','0px');orb.style.setProperty('--eye-y','0px');orb.style.setProperty('--orb-turn','0deg')}
function moveEyes(e){if(e.pointerType!=='mouse'||motion.matches||document.hidden)return;pointer={x:e.clientX,y:e.clientY};if(eyeFrame)return;eyeFrame=requestAnimationFrame(()=>{eyeFrame=0;if(!pointer)return;const r=orb.getBoundingClientRect();const x=Math.max(-1,Math.min(1,(pointer.x-r.left-r.width/2)/220)),y=Math.max(-1,Math.min(1,(pointer.y-r.top-r.height/2)/220));orb.style.setProperty('--eye-x',`${x*3}px`);orb.style.setProperty('--eye-y',`${y*2.5}px`);orb.style.setProperty('--orb-turn',`${x*9}deg`)})}
window.addEventListener('pointermove',moveEyes,{passive:true});document.documentElement.addEventListener('pointerleave',neutralEyes);window.addEventListener('blur',()=>{neutralEyes();if(!pinned)hide(false)});motion.addEventListener('change',neutralEyes);document.addEventListener('visibilitychange',()=>{fab.classList.toggle('dog-paused',document.hidden);if(document.hidden)neutralEyes()});
async function copyQuestion(){
 show(opener,true);
 status.textContent='';
 try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(prompt);status.textContent='Copied — paste into your favourite assistant.'}
 catch{const fallback=document.getElementById('agent-copy-fallback');fallback.hidden=false;text.focus({preventScroll:true});text.select();let success=false;try{success=document.execCommand('copy')}catch{}if(success){fallback.hidden=true;copy.focus({preventScroll:true})}status.textContent=success?'Copied — paste into your favourite assistant.':'Automatic copy is unavailable. Select the question above and use Copy.'}
}
copy.addEventListener('click',copyQuestion);
panel.querySelector('[data-provider="gemini"]').addEventListener('click',copyQuestion);
})();
