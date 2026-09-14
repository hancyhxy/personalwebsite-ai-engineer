'use strict';
(()=>{
const panel=document.getElementById('agent-panel'),fab=document.getElementById('agent-fab'),hero=document.getElementById('agent-link'),close=document.getElementById('close-agent'),copy=document.getElementById('copy-prompt'),text=document.getElementById('agent-prompt'),status=document.getElementById('copy-status');
// Only the current public portfolio deployment. No local résumé contents or private contact details.
const prompt=`Help me understand Xinyi Han and explore her relevance to my team. Read her public portfolio at https://xyhan.com/ and, if accessible, https://xyhan.com/llms.txt for a recruiter reading guide and case-study links. Use linked cases as evidence, not the guide alone. Do not use the old GitHub Pages deployment.
First give a 30-second brief (under 150 words): who she is, her previous UX/product design work versus independent AI building, and 2–3 distinctive strengths with source links. Select relevant projects rather than listing everything.
If I have not supplied a company and role/JD, give the brief first, then ask one question: "Which company and role are you hiring for? Paste a public job link or the relevant requirements, without confidential or personal information."
Once supplied, keep the comparison under 350 words: one-sentence relevance summary; up to 4 rows of requirement → her specific contribution + source → direct evidence / transferable experience / not evidenced; 2 projects to review first and why; 3 focused interview questions to verify the main unknowns. Use official company/job sources for company needs, separately from her portfolio. If a job link cannot be read, ask for the requirements. If only a company is known, label possible intersections as hypotheses, not open vacancies or confirmed requirements.
Distinguish UX ownership from engineering implementation, prototypes from production systems, and stated outcomes from independently verified results. Do not infer ML training, infrastructure expertise, seniority, employment dates, work rights, availability or endorsements. Missing evidence is an interview question, not proof of inability. Do not give a fit percentage or hiring verdict. Cite factual claims; label inferences. If browsing fails, say what you could not read and request public case text instead of inventing a summary. Reply in my language.`;
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
