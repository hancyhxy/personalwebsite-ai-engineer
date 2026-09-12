'use strict';
(()=>{
 const clock=document.getElementById('footer-time');
 if(!clock)return;
 const format=new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});
 let timer;
 function update(){const now=new Date();clock.textContent=format.format(now).toUpperCase();clock.dateTime=now.toISOString()}
 function resume(){clearInterval(timer);update();if(!document.hidden)timer=setInterval(update,1000)}
 document.addEventListener('visibilitychange',resume);resume();
})();
